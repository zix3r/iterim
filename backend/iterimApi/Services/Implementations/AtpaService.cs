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
                Message  = "Komanda neturi narių, todėl priskyrimų pasiūlyti negalima.",
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

            var memberTags = m.Tags
                .Select(t => t.Tag.Name)
                .ToHashSet(StringComparer.OrdinalIgnoreCase);

            memberStates.Add(new MemberState
            {
                Member               = m,
                WeeklyHours          = weeklyHours,
                BaseCapacityHours    = baseCapacity,
                AbsenceHours         = absenceHours,
                AlreadyAssignedHours = alreadyAssignedHours,
                AvailableHours       = available,
                VelocityAvg          = velocityAvg,
                Tags                 = memberTags,
            });

            response.MemberCapacities.Add(new MemberCapacityDto
            {
                MemberId               = m.Id,
                MemberName             = m.OrgMember.User.Name,
                WeeklyHours            = weeklyHours,
                BaseCapacityHours      = Math.Round(baseCapacity, 2),
                AbsenceHours           = Math.Round(absenceHours, 2),
                AlreadyAssignedHours   = Math.Round(alreadyAssignedHours, 2),
                AvailableCapacityHours = Math.Round(available, 2),
                VelocityAvgPoints      = Math.Round(velocityAvg, 2),
                Tags                   = memberTags.ToList(),
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
            if (workItemTags.Count > 0
                && !memberStates.Any(s => s.Tags.Overlaps(workItemTags)))
            {
                response.Warnings.Add(new AtpaWarningDto
                {
                    Severity        = "info",
                    Code            = "NO_TAG_MATCH",
                    Message         = $"Work item „{wi.Title}\" turi žymes, bet nė vienas narys neturi atitinkamų — priskirta pagal capacity.",
                    RelatedEntityId = wi.Id,
                });
            }

            // Candidates = members with enough remaining capacity.
            var candidates = memberStates
                .Where(s => s.AvailableHours + 1e-9 >= workItemHours)
                .ToList();

            if (candidates.Count == 0)
            {
                // Hard miss — remember why.
                var reason = workItemSp == 0
                    ? "Visi nariai pilni — laisvos capacity nepakanka."
                    : $"Visi nariai pilni arba SP ({workItemSp}) viršija bet kurio nario likusią capacity.";

                // Distinguish "SP too big for anyone" even fully fresh.
                var biggestFreshCapacityHours = memberStates
                    .Select(s => s.BaseCapacityHours - s.AbsenceHours)
                    .DefaultIfEmpty(0)
                    .Max();
                if (workItemHours > biggestFreshCapacityHours)
                {
                    reason = $"Work item SP ({workItemSp}) viršija bet kurio nario didžiausią capacity.";
                    response.Warnings.Add(new AtpaWarningDto
                    {
                        Severity        = "warning",
                        Code            = "SP_EXCEEDS_CAPACITY",
                        Message         = $"„{wi.Title}\" SP ({workItemSp}) yra didesnis nei bet kurio nario capacity — apsvarstykite suskaidymą.",
                        RelatedEntityId = wi.Id,
                    });
                }
                else
                {
                    response.Warnings.Add(new AtpaWarningDto
                    {
                        Severity        = "warning",
                        Code            = "ALL_MEMBERS_OVERLOADED",
                        Message         = $"Nepavyko priskirti „{wi.Title}\" — visi nariai jau perpildyti.",
                        RelatedEntityId = wi.Id,
                    });
                }

                response.Unassigned.Add(new UnassignedItemDto
                {
                    WorkItemId     = wi.Id,
                    WorkItemTitle  = wi.Title,
                    WorkItemPoints = workItemSp,
                    WorkItemTags   = workItemTags.ToList(),
                    Reason         = reason,
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
                var tagScore     = ComputeTagMatchScore(workItemTags, c.Tags);
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

            // Update remaining capacity.
            best.AvailableHours = Math.Max(0.0, best.AvailableHours - workItemHours);
            // Reflect change in the response capacity dto as well.
            var capDto = response.MemberCapacities.First(c => c.MemberId == best.Member.Id);
            capDto.AvailableCapacityHours = Math.Round(best.AvailableHours, 2);

            response.Suggestions.Add(new AssignmentSuggestionDto
            {
                WorkItemId        = wi.Id,
                WorkItemTitle     = wi.Title,
                WorkItemPoints    = workItemSp,
                WorkItemTags      = workItemTags.ToList(),
                SuggestedMemberId = best.Member.Id,
                MemberName        = best.Member.OrgMember.User.Name,
                MemberTags        = best.Tags.ToList(),
                Confidence        = Math.Round(bestScore * 100.0, 1),
                Reason            = BuildReason(bestTagScore, bestCapacityScore, workItemTags, best),
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
                    Message         = $"{s.Member.OrgMember.User.Name} pasiekė capacity ribą — naujų work items priskirti nebegalima.",
                    RelatedEntityId = s.Member.Id,
                });
            }
        }

        return response;
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    /// <summary>
    /// Tag match score:
    ///   - work item has no tags         → 1.0 (everyone equal)
    ///   - member has none of the tags   → 0.2 (small but non-zero)
    ///   - otherwise                     → matches / workItemTagCount
    /// </summary>
    private static double ComputeTagMatchScore(
        IReadOnlyCollection<string> workItemTags,
        IReadOnlyCollection<string> memberTags)
    {
        if (workItemTags.Count == 0) return 1.0;

        var matches = workItemTags.Count(t => memberTags.Contains(t, StringComparer.OrdinalIgnoreCase));
        if (matches == 0) return NoTagMatchScore;

        return (double)matches / workItemTags.Count;
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

    private async Task EnsureTeamMember(int teamId, int userId)
    {
        var team = await _db.Teams.FirstOrDefaultAsync(t => t.Id == teamId)
            ?? throw new KeyNotFoundException("Team not found");

        var isMember = await _db.TeamMembers
            .AnyAsync(tm => tm.TeamId == teamId && tm.OrgMember.UserId == userId);

        if (!isMember)
            throw new UnauthorizedAccessException("User is not a member of this team");
    }

    private static string BuildReason(
        double tagScore,
        double capacityScore,
        IReadOnlyCollection<string> workItemTags,
        MemberState pick)
    {
        var parts = new List<string>();

        if (workItemTags.Count == 0)
            parts.Add("nėra žymių, sprendimas pagal capacity");
        else if (tagScore >= 0.99)
            parts.Add("visiškai sutampa žymės");
        else if (tagScore >= 0.5)
            parts.Add("dalinis žymių sutapimas");
        else if (tagScore <= NoTagMatchScore + 1e-6)
            parts.Add("žymių sutapimo nėra");
        else
            parts.Add("dalinis žymių sutapimas");

        if (capacityScore >= 0.9)
            parts.Add("daugiausia laisvos capacity");
        else if (capacityScore >= 0.5)
            parts.Add("pakankama laisva capacity");
        else
            parts.Add("ribota laisva capacity");

        return string.Join("; ", parts);
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
        public required HashSet<string> Tags { get; init; }
    }
}
