using iterimApi.Data;
using iterimApi.DTOs.Atpa;
using iterimApi.Models.Entities;
using iterimApi.Models.Enums;
using iterimApi.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace iterimApi.Services.Implementations;

/// <summary>
/// ATPA — Automatiškas Task'ų Priskyrimo Algoritmas.
///
/// High-level flow:
///   1. Load iteration + team + members (with tags) + work items (with tags) + absences.
///   2. Compute base capacity per member from WeeklyHours and the iteration's working days.
///   3. Subtract absence hours (workdays inside iteration that overlap an absence).
///   4. Subtract hours already booked through previously-assigned items.
///   5. Look at the last 3 completed sprints to derive each member's average velocity
///      (used when SP > capacity to soften the warning, and for the team-average fallback).
///   6. Sort unassigned items by Priority desc, then SP desc.
///   7. For each item:
///         - Build candidate list (members whose remaining capacity covers item SP).
///         - Score each candidate: finalScore = tagMatch*0.6 + capacity*0.4.
///         - Pick the highest finalScore; deduct used capacity.
///   8. Emit warnings/info for overload, missing tags and unassigned items.
///
/// Suggestions are recommendations only — the caller must confirm them.
/// </summary>
public class AtpaService : IAtpaService
{
    private readonly AppDbContext _db;

    // Default conversion ratio used when no org-level override is configured.
    // 1 story point ≈ 4 hours (rough industry default).
    private const double DefaultHoursPerStoryPoint = 4.0;

    // Weights from the algorithm spec.
    private const double TagWeight = 0.6;
    private const double CapacityWeight = 0.4;

    // When a work item has tags but the member has none of them — small but
    // non-zero score so capacity can still drive the decision.
    private const double NoTagMatchScore = 0.2;

    // Number of completed sprints to look back for velocity.
    private const int VelocitySprintCount = 3;

    // Inferred-tag weight: a tag the member has via past completed items
    // (but NOT via explicit Team settings) contributes this fraction of an
    // explicit-tag match. 1.0 = equal trust, 0.5 = half trust. 0.75 keeps
    // history strong but still rewards explicitly curated skills.
    private const double InferredTagWeight = 0.75;

    // A tag must appear on at least this many of a member's recently-completed
    // items before it is inferred. 1 = pick up signal as soon as a member
    // has done one Done item with that tag (faster learning, more noise from
    // one-off cross-discipline assignments). 2+ requires repeated history.
    private const int InferredTagMinFrequency = 1;

    // ── i18n contract ─────────────────────────────────────────────────────────
    // Backend emits stable string codes (see `Code` / `ReasonCodes` /
    // `ReasonCode` fields) plus parameter dictionaries. The English `Message`
    // / `Reason` fields are plain-English fallbacks for non-i18n consumers
    // (logs, alternate clients). Frontend resolves codes via i18n keys
    // `atpa.warning.<CODE>`, `atpa.reason.<CODE>`, `atpa.unassigned.<CODE>`.
    // See iterimWeb/src/i18n/translations.ts for the matching set.

    public AtpaService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<SuggestAssignmentsResponseDto> SuggestAssignmentsAsync(int iterationId, int userId)
    {
        // ── 1. Load iteration ────────────────────────────────────────────────
        var iteration = await _db.Iterations
            .Include(i => i.WorkItems).ThenInclude(wi => wi.Tags).ThenInclude(t => t.Tag)
            .FirstOrDefaultAsync(i => i.Id == iterationId)
            ?? throw new KeyNotFoundException("Iteration not found");

        await EnsureTeamMember(iteration.TeamId, userId);

        var response = new SuggestAssignmentsResponseDto
        {
            IterationId = iteration.Id,
            TeamId      = iteration.TeamId,
        };

        // ── 2. Load team members (with tags, absences, currently assigned items) ──
        var members = await _db.TeamMembers
            .Where(tm => tm.TeamId == iteration.TeamId)
            .Include(tm => tm.OrgMember).ThenInclude(om => om.User)
            .Include(tm => tm.OrgMember).ThenInclude(om => om.Absences)
            .Include(tm => tm.Tags).ThenInclude(t => t.Tag)
            .Include(tm => tm.AssignedWorkItems)
            .ToListAsync();

        if (members.Count == 0)
        {
            response.Warnings.Add(new AtpaWarningDto
            {
                Severity = "warning",
                Code     = "NO_TEAM_MEMBERS",
                Message  = "Team has no members; cannot suggest assignments.",
            });
            return response;
        }

        // ── 3. Hours-per-SP conversion ratio ─────────────────────────────────
        // (No org-level field exists today, so we fall back to the default constant.
        //  When OrganizationConfig grows a HoursPerStoryPoint column it can be
        //  read here without changing the algorithm.)
        var hoursPerSp = DefaultHoursPerStoryPoint;

        // ── 4. Iteration working days ────────────────────────────────────────
        var workingDays = CountWorkingDays(iteration.StartDate, iteration.EndDate);

        // ── 5. Velocity history (last 3 completed sprints) ───────────────────
        var velocityByMember = await GetVelocityHistoryAsync(iteration.TeamId, iteration.Id);
        var teamAvgVelocity = velocityByMember.Count > 0
            ? velocityByMember.Values.Average()
            : 0.0;

        // ── 5b. Inferred-tag history ─────────────────────────────────────────
        // Members may not be tagged explicitly, but their past work usually
        // tells the algorithm what they're good at. Tags they completed
        // ≥ InferredTagMinFrequency times across the lookback window are
        // pulled in as a softer signal (weighted by InferredTagWeight).
        var inferredTagsByMember = await GetInferredTagsByMemberAsync(iteration.TeamId, iteration.Id);

        // ── 6. Compute capacity per member ───────────────────────────────────
        var memberStates = new List<MemberState>();

        foreach (var m in members)
        {
            var weeklyHours = m.WeeklyHours > 0 ? m.WeeklyHours : 40;
            var hoursPerDay = weeklyHours / 5.0;

            // Base capacity for this iteration.
            var baseCapacity = hoursPerDay * workingDays;

            // Absence impact — count working days inside the iteration that
            // overlap any of the member's absences.
            var absenceWorkdays = CountAbsenceWorkdays(
                m.OrgMember.Absences,
                iteration.StartDate,
                iteration.EndDate);
            var absenceHours = absenceWorkdays * hoursPerDay;

            // Already-assigned load (work items currently owned by this member
            // that belong to THIS iteration and are not Done).
            var alreadyAssignedSp = m.AssignedWorkItems
                .Where(wi => wi.IterationId == iteration.Id
                          && wi.Status != WorkItemStatus.Done
                          && wi.Points.HasValue)
                .Sum(wi => wi.Points!.Value);
            var alreadyAssignedHours = alreadyAssignedSp * hoursPerSp;

            var available = Math.Max(0.0, baseCapacity - absenceHours - alreadyAssignedHours);

            var velocityAvg = velocityByMember.TryGetValue(m.Id, out var v)
                ? v
                : teamAvgVelocity; // fallback: team average

            var explicitTags = m.Tags
                .Select(t => t.Tag.Name)
                .ToHashSet(StringComparer.OrdinalIgnoreCase);

            var inferredTags = inferredTagsByMember.TryGetValue(m.Id, out var inf)
                ? new HashSet<string>(inf, StringComparer.OrdinalIgnoreCase)
                : new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            // Inferred-only = inferred minus tags already explicit (avoid double counting).
            inferredTags.ExceptWith(explicitTags);

            // Combined view used by the existing Overlaps / warning logic.
            var combinedTags = new HashSet<string>(explicitTags, StringComparer.OrdinalIgnoreCase);
            combinedTags.UnionWith(inferredTags);

            memberStates.Add(new MemberState
            {
                Member               = m,
                WeeklyHours          = weeklyHours,
                BaseCapacityHours    = baseCapacity,
                AbsenceHours         = absenceHours,
                AlreadyAssignedHours = alreadyAssignedHours,
                AvailableHours       = available,
                VelocityAvg          = velocityAvg,
                ExplicitTags         = explicitTags,
                InferredTags         = inferredTags,
                Tags                 = combinedTags,
            });

            response.MemberCapacities.Add(new MemberCapacityDto
            {
                MemberId               = m.Id,
                MemberName             = m.OrgMember.User.Name,
                AvatarUrl              = m.OrgMember.User.AvatarUrl,
                ScheduleType           = m.ScheduleType.ToString(),
                WeeklyHours            = weeklyHours,
                BaseCapacityHours      = Math.Round(baseCapacity, 2),
                AbsenceHours           = Math.Round(absenceHours, 2),
                AlreadyAssignedHours   = Math.Round(alreadyAssignedHours, 2),
                AvailableCapacityHours = Math.Round(available, 2),
                VelocityAvgPoints      = Math.Round(velocityAvg, 2),
                Tags                   = explicitTags.ToList(),
                InferredTags           = inferredTags.ToList(),
            });
        }

        // ── 7. Pick unassigned work items in this iteration ──────────────────
        var unassignedItems = iteration.WorkItems
            .Where(wi => wi.AssignedTo == null && wi.Status != WorkItemStatus.Done)
            .OrderByDescending(wi => wi.Priority)             // High > Medium > Low
            .ThenByDescending(wi => wi.Points ?? 0)           // bigger first
            .ThenBy(wi => wi.Position)
            .ToList();

        if (unassignedItems.Count == 0)
        {
            return response; // nothing to suggest
        }

        // Maximum capacity used to normalise the capacity score (recomputed each round).
        // ── 8. Assignment loop ───────────────────────────────────────────────
        foreach (var wi in unassignedItems)
        {
            var workItemSp     = wi.Points ?? 0;
            var workItemHours  = workItemSp * hoursPerSp;
            var workItemTags   = wi.Tags
                .Select(t => t.Tag.Name)
                .ToHashSet(StringComparer.OrdinalIgnoreCase);

            // Detect "no member has matching tags" — info only.
            // `s.Tags` is the union of explicit + inferred-from-history, so this
            // warning now fires only when neither curated tags nor past completed
            // work suggest a fit — i.e. genuinely no signal beyond capacity.
            if (workItemTags.Count > 0
                && !memberStates.Any(s => s.Tags.Overlaps(workItemTags)))
            {
                response.Warnings.Add(new AtpaWarningDto
                {
                    Severity        = "info",
                    Code            = "NO_TAG_MATCH",
                    Message         = $"\"{wi.Title}\" has tags no member shares (neither explicit nor inferred); assigned by capacity only.",
                    MessageParams   = new() { ["title"] = wi.Title },
                    RelatedEntityId = wi.Id,
                });
            }

            // Candidates = members with enough remaining capacity.
            var candidates = memberStates
                .Where(s => s.AvailableHours + 1e-9 >= workItemHours)
                .ToList();

            if (candidates.Count == 0)
            {
                // Hard miss — remember why. We pick a stable code that the FE can
                // localize (UNASSIGNED_OVERSIZED for "too big for anyone even fresh"
                // vs UNASSIGNED_ALL_FULL for "everyone is at remaining-capacity ceiling").
                var biggestFreshCapacityHours = memberStates
                    .Select(s => s.BaseCapacityHours - s.AbsenceHours)
                    .DefaultIfEmpty(0)
                    .Max();
                var titleParam = wi.Title;
                var spParam    = workItemSp.ToString();

                // Note: distinct names from the assigned-suggestion path below (`reasonText`,
                // `reasonCodes`) — C# disallows shadowing within the same local-variable
                // declaration space even across sibling blocks.
                string unassignedReasonCode;
                string unassignedReasonText;

                if (workItemHours > biggestFreshCapacityHours)
                {
                    unassignedReasonCode = "UNASSIGNED_OVERSIZED";
                    unassignedReasonText = $"\"{wi.Title}\" SP ({workItemSp}) exceeds every member's full capacity.";
                    response.Warnings.Add(new AtpaWarningDto
                    {
                        Severity        = "warning",
                        Code            = "SP_EXCEEDS_CAPACITY",
                        Message         = $"\"{wi.Title}\" SP ({workItemSp}) exceeds every member's capacity — consider splitting.",
                        MessageParams   = new() { ["title"] = titleParam, ["sp"] = spParam },
                        RelatedEntityId = wi.Id,
                    });
                }
                else
                {
                    unassignedReasonCode = workItemSp == 0
                        ? "UNASSIGNED_ALL_FULL_NO_SP"
                        : "UNASSIGNED_ALL_FULL";
                    unassignedReasonText = workItemSp == 0
                        ? "All members are full — no remaining capacity."
                        : $"All members full or SP ({workItemSp}) exceeds every member's remaining capacity.";

                    response.Warnings.Add(new AtpaWarningDto
                    {
                        Severity        = "warning",
                        Code            = "ALL_MEMBERS_OVERLOADED",
                        Message         = $"Couldn't assign \"{wi.Title}\" — all members are at capacity.",
                        MessageParams   = new() { ["title"] = titleParam },
                        RelatedEntityId = wi.Id,
                    });
                }

                response.Unassigned.Add(new UnassignedItemDto
                {
                    WorkItemId     = wi.Id,
                    WorkItemTitle  = wi.Title,
                    WorkItemPoints = workItemSp,
                    WorkItemTags   = workItemTags.ToList(),
                    Reason         = unassignedReasonText,
                    ReasonCode     = unassignedReasonCode,
                    ReasonParams   = new() { ["title"] = titleParam, ["sp"] = spParam },
                });
                continue;
            }

            // Score each candidate.
            var maxAvailable = candidates.Max(c => c.AvailableHours);
            if (maxAvailable <= 0) maxAvailable = 1; // safety guard

            MemberState? best     = null;
            double       bestScore = double.NegativeInfinity;
            double       bestTagScore     = 0;
            double       bestCapacityScore = 0;

            foreach (var c in candidates)
            {
                var tagScore     = ComputeTagMatchScore(workItemTags, c.ExplicitTags, c.InferredTags);
                var capacityScore = c.AvailableHours / maxAvailable;
                var finalScore   = tagScore * TagWeight + capacityScore * CapacityWeight;

                if (finalScore > bestScore)
                {
                    bestScore         = finalScore;
                    best              = c;
                    bestTagScore      = tagScore;
                    bestCapacityScore = capacityScore;
                }
            }

            if (best == null) continue; // unreachable, but keep the compiler happy

            // Update remaining capacity (internal algorithm state only).
            // NOTE: intentionally NOT reflected back to response.MemberCapacities —
            // that DTO represents the *current* state (before applying suggestions).
            // The frontend independently projects the post-suggestion state by summing
            // the suggested SP via queuedByMember, so updating the DTO here would cause
            // the capacity bar to double-count the suggested hours.
            best.AvailableHours = Math.Max(0.0, best.AvailableHours - workItemHours);

            // Split matching tags so the FE can render explicit vs inferred differently.
            var explicitMatching = workItemTags
                .Intersect(best.ExplicitTags, StringComparer.OrdinalIgnoreCase)
                .ToList();
            var inferredMatching = workItemTags
                .Intersect(best.InferredTags, StringComparer.OrdinalIgnoreCase)
                .Except(explicitMatching, StringComparer.OrdinalIgnoreCase)
                .ToList();

            var (reasonText, reasonCodes, reasonParams) = BuildReason(
                bestTagScore, bestCapacityScore, workItemTags, best,
                explicitMatching.Count, inferredMatching.Count);

            response.Suggestions.Add(new AssignmentSuggestionDto
            {
                WorkItemId           = wi.Id,
                WorkItemTitle        = wi.Title,
                WorkItemType         = wi.Type.ToString(),
                WorkItemPoints       = workItemSp,
                WorkItemTags         = workItemTags.ToList(),
                SuggestedMemberId    = best.Member.Id,
                MemberName           = best.Member.OrgMember.User.Name,
                MemberAvatarUrl      = best.Member.OrgMember.User.AvatarUrl,
                MemberTags           = best.ExplicitTags.ToList(),
                MemberInferredTags   = best.InferredTags.ToList(),
                MatchingTags         = explicitMatching,
                MatchingInferredTags = inferredMatching,
                Confidence           = Math.Round(bestScore * 100.0, 1),
                Reason               = reasonText,
                ReasonCodes          = reasonCodes,
                ReasonParams         = reasonParams,
            });
        }

        // ── 9. Final overload check — warn if any member ended above capacity ──
        foreach (var s in memberStates)
        {
            if (s.AvailableHours <= 0 && s.AlreadyAssignedHours + s.AbsenceHours >= s.BaseCapacityHours)
            {
                response.Warnings.Add(new AtpaWarningDto
                {
                    Severity        = "warning",
                    Code            = "MEMBER_OVERLOADED",
                    Message         = $"{s.Member.OrgMember.User.Name} reached capacity — no further items can be assigned.",
                    MessageParams   = new() { ["name"] = s.Member.OrgMember.User.Name },
                    RelatedEntityId = s.Member.Id,
                });
            }
        }

        return response;
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    /// <summary>
    /// Tag match score:
    ///   - work item has no tags                        → 1.0 (everyone equal)
    ///   - no explicit AND no inferred matches          → 0.2 (small but non-zero)
    ///   - otherwise: (explicitMatches + InferredTagWeight × inferredOnlyMatches) / workItemTagCount
    ///
    /// Explicit tags (Team-settings curated) count as a full point. Inferred
    /// tags (pulled from the member's history of completed work) count as
    /// <see cref="InferredTagWeight"/> — strong signal but discounted because
    /// historical pairings can include accidents and one-offs. A member who
    /// has the tag both explicitly and inferred is only counted once (explicit).
    /// </summary>
    private static double ComputeTagMatchScore(
        IReadOnlyCollection<string> workItemTags,
        IReadOnlyCollection<string> explicitTags,
        IReadOnlyCollection<string> inferredTags)
    {
        if (workItemTags.Count == 0) return 1.0;

        var explicitMatches = workItemTags
            .Count(t => explicitTags.Contains(t, StringComparer.OrdinalIgnoreCase));

        // Count inferred-only matches (already deduped at MemberState construction
        // time, but be defensive in case callers pass overlapping sets).
        var inferredMatches = workItemTags
            .Count(t => inferredTags.Contains(t, StringComparer.OrdinalIgnoreCase)
                     && !explicitTags.Contains(t, StringComparer.OrdinalIgnoreCase));

        if (explicitMatches == 0 && inferredMatches == 0)
            return NoTagMatchScore;

        var weighted = explicitMatches + InferredTagWeight * inferredMatches;
        return Math.Min(1.0, weighted / workItemTags.Count);
    }

    /// <summary>
    /// Counts working days (Mon-Fri) between the two dates, inclusive.
    /// </summary>
    private static int CountWorkingDays(DateOnly start, DateOnly end)
    {
        if (end < start) return 0;
        var days = 0;
        for (var d = start; d <= end; d = d.AddDays(1))
        {
            var dow = d.DayOfWeek;
            if (dow != DayOfWeek.Saturday && dow != DayOfWeek.Sunday)
                days++;
        }
        return days;
    }

    /// <summary>
    /// Counts working days the member was absent inside the iteration window.
    /// </summary>
    private static int CountAbsenceWorkdays(
        IEnumerable<MemberAbsence> absences,
        DateOnly iterationStart,
        DateOnly iterationEnd)
    {
        var total = 0;
        foreach (var a in absences)
        {
            var from = a.FromDate < iterationStart ? iterationStart : a.FromDate;
            var to   = a.ToDate   > iterationEnd   ? iterationEnd   : a.ToDate;
            if (to < from) continue;
            total += CountWorkingDays(from, to);
        }
        return total;
    }

    /// <summary>
    /// Returns a dictionary of TeamMemberId → average completed points
    /// across the last <see cref="VelocitySprintCount"/> completed sprints
    /// before the given iteration. Members without history are absent from
    /// the dictionary (caller falls back to the team average).
    /// </summary>
    private async Task<Dictionary<int, double>> GetVelocityHistoryAsync(int teamId, int currentIterationId)
    {
        var pastIterationIds = await _db.Iterations
            .Where(i => i.TeamId == teamId
                     && i.Status == IterationStatus.Completed
                     && i.Id != currentIterationId)
            .OrderByDescending(i => i.Id)
            .Take(VelocitySprintCount)
            .Select(i => i.Id)
            .ToListAsync();

        if (pastIterationIds.Count == 0)
            return [];

        // Sum done points per assignee, then divide by sprint count to get an avg.
        var rows = await _db.WorkItems
            .Where(wi => wi.IterationId != null
                      && pastIterationIds.Contains(wi.IterationId!.Value)
                      && wi.AssignedTo != null
                      && wi.Status == WorkItemStatus.Done
                      && wi.Points != null)
            .GroupBy(wi => wi.AssignedTo!.Value)
            .Select(g => new { MemberId = g.Key, Total = g.Sum(wi => wi.Points!.Value) })
            .ToListAsync();

        return rows.ToDictionary(r => r.MemberId, r => (double)r.Total / pastIterationIds.Count);
    }

    /// <summary>
    /// Returns each team member's "inferred" tag set — tags that appeared on at
    /// least <see cref="InferredTagMinFrequency"/> of their <c>Done</c> work items
    /// across the last <see cref="VelocitySprintCount"/> completed sprints.
    ///
    /// This is what fixes the case "FE work always done by member A, BE always by
    /// member B, but neither has explicit tags": history-derived expertise is
    /// surfaced and used in scoring.
    /// </summary>
    private async Task<Dictionary<int, HashSet<string>>> GetInferredTagsByMemberAsync(
        int teamId,
        int currentIterationId)
    {
        // Lookback window: last N completed sprints. We use this to constrain the
        // inferred-tag query when there IS history, so an old, decade-stale tag
        // doesn't outweigh recent reality. When there's no completed history yet,
        // we fall back to "all Done items by this team (excluding the current
        // iteration)" — this catches the common "previous sprint never explicitly
        // marked Completed" case the team flagged.
        var pastIterationIds = await _db.Iterations
            .Where(i => i.TeamId == teamId
                     && i.Status == IterationStatus.Completed
                     && i.Id != currentIterationId)
            .OrderByDescending(i => i.Id)
            .Take(VelocitySprintCount)
            .Select(i => i.Id)
            .ToListAsync();

        // Build the (memberId, tagName) query. The base filter is "any Done item
        // in this team that the member completed". When we have a Completed-sprint
        // window, we narrow to that window for relevance.
        var query = _db.WorkItems
            .Where(wi => wi.TeamId == teamId
                      && wi.AssignedTo != null
                      && wi.Status == WorkItemStatus.Done
                      && wi.IterationId != currentIterationId);

        if (pastIterationIds.Count > 0)
        {
            // Prefer the completed-sprint window when it exists.
            query = query.Where(wi => wi.IterationId != null
                                   && pastIterationIds.Contains(wi.IterationId!.Value));
        }

        var rows = await query
            .SelectMany(wi => wi.Tags.Select(wt => new
            {
                MemberId = wi.AssignedTo!.Value,
                TagName  = wt.Tag.Name,
            }))
            .ToListAsync();

        // Build per-member tag-frequency map, then keep tags >= threshold.
        var byMember = new Dictionary<int, Dictionary<string, int>>();
        foreach (var r in rows)
        {
            if (!byMember.TryGetValue(r.MemberId, out var freq))
            {
                freq = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
                byMember[r.MemberId] = freq;
            }
            freq[r.TagName] = freq.GetValueOrDefault(r.TagName, 0) + 1;
        }

        return byMember.ToDictionary(
            kv => kv.Key,
            kv => kv.Value
                .Where(t => t.Value >= InferredTagMinFrequency)
                .Select(t => t.Key)
                .ToHashSet(StringComparer.OrdinalIgnoreCase));
    }

    private async Task EnsureTeamMember(int teamId, int userId)
    {
        var team = await _db.Teams.FirstOrDefaultAsync(t => t.Id == teamId)
            ?? throw new KeyNotFoundException("Team not found");

        var isMember = await _db.TeamMembers
            .AnyAsync(tm => tm.TeamId == teamId && tm.OrgMember.UserId == userId);

        if (!isMember)
            throw new UnauthorizedAccessException("User is not a member of this team");
    }

    /// <summary>
    /// Returns a human-readable reason in English (fallback) and a list of stable
    /// reason codes that the frontend can translate via i18n. Order of codes is
    /// preserved so the FE can render them as a single sentence in the order
    /// the algorithm produced them.
    /// </summary>
    private static (string Text, List<string> Codes, Dictionary<string, string> Params) BuildReason(
        double tagScore,
        double capacityScore,
        IReadOnlyCollection<string> workItemTags,
        MemberState pick,
        int explicitMatchCount,
        int inferredMatchCount)
    {
        var codes = new List<string>();
        var parts = new List<string>();
        var prms  = new Dictionary<string, string>
        {
            ["explicitMatchCount"] = explicitMatchCount.ToString(),
            ["inferredMatchCount"] = inferredMatchCount.ToString(),
        };

        // Tag-side reason: pick exactly one code.
        if (workItemTags.Count == 0)
        {
            codes.Add("REASON_NO_TAGS_CAPACITY_BASED");
            parts.Add("no tags, decision based on capacity");
        }
        else if (explicitMatchCount > 0 && inferredMatchCount > 0)
        {
            codes.Add("REASON_TAG_MIXED_MATCH");
            parts.Add($"matches via tags and history ({explicitMatchCount} expl. + {inferredMatchCount} infer.)");
        }
        else if (explicitMatchCount > 0)
        {
            if (tagScore >= 0.99)
            {
                codes.Add("REASON_TAG_FULL_MATCH");
                parts.Add("all tags match");
            }
            else
            {
                codes.Add("REASON_TAG_PARTIAL_MATCH");
                parts.Add("partial tag match");
            }
        }
        else if (inferredMatchCount > 0)
        {
            // Match came purely from past completed work — important to surface
            // because the user didn't explicitly tag this person yet.
            if (inferredMatchCount == workItemTags.Count)
            {
                codes.Add("REASON_TAG_INFERRED_FULL");
                parts.Add("all tags match via member history");
            }
            else
            {
                codes.Add("REASON_TAG_INFERRED_PARTIAL");
                parts.Add("partial match via member history");
            }
        }
        else
        {
            codes.Add("REASON_TAG_NO_MATCH");
            parts.Add("no tag overlap");
        }

        // Capacity-side reason: pick exactly one code.
        if (capacityScore >= 0.9)
        {
            codes.Add("REASON_CAPACITY_HIGH");
            parts.Add("most available capacity");
        }
        else if (capacityScore >= 0.5)
        {
            codes.Add("REASON_CAPACITY_MEDIUM");
            parts.Add("decent free capacity");
        }
        else
        {
            codes.Add("REASON_CAPACITY_LOW");
            parts.Add("limited free capacity");
        }

        return (string.Join("; ", parts), codes, prms);
    }

    /// <summary>
    /// Mutable per-member state used during the assignment loop.
    /// </summary>
    private sealed class MemberState
    {
        public required TeamMember Member { get; init; }
        public required int WeeklyHours { get; init; }
        public required double BaseCapacityHours { get; init; }
        public required double AbsenceHours { get; init; }
        public required double AlreadyAssignedHours { get; init; }
        public double AvailableHours { get; set; }
        public required double VelocityAvg { get; init; }

        /// <summary>Tags explicitly assigned in Team settings.</summary>
        public required HashSet<string> ExplicitTags { get; init; }

        /// <summary>Tags inferred from the member's recent completed work items.</summary>
        public required HashSet<string> InferredTags { get; init; }

        /// <summary>Union of explicit + inferred — used by warning/Overlaps checks.</summary>
        public required HashSet<string> Tags { get; init; }
    }
}
