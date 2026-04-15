using iterimApi.Data;
using iterimApi.DTOs.Metrics;
using iterimApi.Models.Enums;
using iterimApi.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace iterimApi.Services.Implementations;

public class MetricsService : IMetricsService
{
    private readonly AppDbContext _db;

    public MetricsService(AppDbContext db)
    {
        _db = db;
    }

    // ── Velocity ────────────────────────────────────────────────────────────

    public async Task<VelocityDto> GetVelocityAsync(int teamId, int userId, int sprintCount = 5, int? beforeIterationId = null)
    {
        await EnsureTeamAccessAsync(teamId, userId);

        // Take the N most recent completed sprints before (and including) the given iteration.
        // Sort priority: Id desc, then CreatedAt desc (as specified).
        var query = _db.Iterations
            .Where(i => i.TeamId == teamId && i.Status == IterationStatus.Completed);

        if (beforeIterationId.HasValue)
            query = query.Where(i => i.Id <= beforeIterationId.Value);

        var iterations = await query
            .Include(i => i.WorkItems)
            .OrderByDescending(i => i.Id)
            .ThenByDescending(i => i.CreatedAt)
            .Take(sprintCount)
            .ToListAsync();

        var sprintItems = iterations
            .OrderBy(i => i.Id)
            .Select(i => new SprintVelocityItem
            {
                IterationId     = i.Id,
                Name            = i.Name,
                StartDate       = i.StartDate,
                EndDate         = i.EndDate,
                // Use snapshot values captured at completion time.
                // Fall back to live WorkItems sum for iterations completed before
                // the snapshot feature was introduced (SnapshotPlannedPoints == null).
                PlannedPoints   = i.SnapshotPlannedPoints
                    ?? i.WorkItems.Where(w => w.Points.HasValue).Sum(w => w.Points!.Value),
                CompletedPoints = i.SnapshotCompletedPoints
                    ?? i.WorkItems.Where(w => w.Points.HasValue && w.Status == WorkItemStatus.Done).Sum(w => w.Points!.Value),
            })
            .ToList();

        var avg = sprintItems.Count > 0
            ? Math.Round((decimal)sprintItems.Average(s => s.CompletedPoints), 1)
            : 0m;

        return new VelocityDto
        {
            Sprints         = sprintItems,
            AverageVelocity = avg
        };
    }

    // ── Sprint Metrics + Burndown ────────────────────────────────────────────

   public async Task<SprintMetricsDto> GetSprintMetricsAsync(int iterationId, int userId)
    {
        var iteration = await _db.Iterations
            .Include(i => i.WorkItems)
                .ThenInclude(w => w.History)
            .FirstOrDefaultAsync(i => i.Id == iterationId)
            ?? throw new KeyNotFoundException($"Iteration {iterationId} not found.");

        await EnsureTeamAccessAsync(iteration.TeamId, userId);

        var workItems = iteration.WorkItems.ToList();

        int totalPoints;
        int completedPoints;

        // Jei Iteracija baigta, naudojame jos užfiksuotą Snapshot'ą.
        // Priešingu atveju - skaičiuojame gyvai iš WorkItems sąrašo.
        if (iteration.Status == IterationStatus.Completed)
        {
            // Kadangi Snapshot laukai tikriausiai yra int? (nullable), priskiriame 0 jei null
            totalPoints = iteration.SnapshotPlannedPoints ?? 0;
            completedPoints = iteration.SnapshotCompletedPoints ?? 0;
        }
        else
        {
            totalPoints = workItems.Where(w => w.Points.HasValue).Sum(w => w.Points!.Value);
            completedPoints = workItems
                .Where(w => w.Points.HasValue && w.Status == WorkItemStatus.Done)
                .Sum(w => w.Points!.Value);
        }

        // Remaining taškai apskaičiuojami iš Total ir Completed
        var remainingPoints = totalPoints - completedPoints;
        var percentComplete = totalPoints > 0
            ? Math.Round((decimal)completedPoints / totalPoints * 100, 1)
            : 0m;

        // ByStatus ir ByType gyviems grafikams.
        // Čia paliekame skaičiuoti iš dabartinių WorkItems, nes užbaigtame sprinte
        // norime matyti, kokios užduotys realiai buvo padarytos (likusios buvo išmestos).
        var byStatus = workItems
            .GroupBy(w => w.Status.ToString())
            .ToDictionary(g => g.Key, g => g.Count());

        var byType = workItems
            .GroupBy(w => w.Type.ToString())
            .ToDictionary(g => g.Key, g => g.Count());

        return new SprintMetricsDto
        {
            IterationId     = iteration.Id,
            Name            = iteration.Name,
            StartDate       = iteration.StartDate,
            EndDate         = iteration.EndDate,
            Status          = iteration.Status.ToString(),
            TotalPoints     = totalPoints,
            CompletedPoints = completedPoints,
            RemainingPoints = remainingPoints,
            PercentComplete = percentComplete,
            ByStatus        = byStatus,
            ByType          = byType,
            Burndown        = BuildBurndown(iteration.StartDate, iteration.EndDate, totalPoints, workItems)
        };
    }

    /// <summary>
    /// Builds an ideal vs. actual burndown chart.
    /// "Actual" remaining points are approximated from WorkItemHistory:
    /// for each day we replay all status-change events up to that day to count
    /// how many points were still not Done. Falls back to a flat line using
    /// current remaining when no history is available.
    /// </summary>
    private static List<BurndownPoint> BuildBurndown(
        DateOnly start,
        DateOnly end,
        int totalPoints,
        List<Models.Entities.WorkItem> workItems)
    {
        var points = new List<BurndownPoint>();
        var today  = DateOnly.FromDateTime(DateTime.UtcNow);
        var last   = end < today ? end : today;   // don't project into future

        if (start > last)
            return points;

        int totalDays = start.DayNumber == end.DayNumber
            ? 1
            : (end.DayNumber - start.DayNumber);

        // For each work item with points, find the date it was LAST moved to Done
        // (and only count it if its current status is still Done — re-opened items don't count).
        // This prevents double-counting if an item was Done → re-opened → Done again.
        var doneDates = workItems
            .Where(w => w.Points.HasValue && w.Status == WorkItemStatus.Done)
            .Select(w =>
            {
                // Find the most recent history entry where status changed TO Done
                var lastDoneEntry = w.History
                    .Where(h => h.FieldName == "Status" && h.NewValue == WorkItemStatus.Done.ToString())
                    .OrderByDescending(h => h.ChangedAt)
                    .FirstOrDefault();

                // If no history entry exists, fall back to UpdatedAt
                // (item was set to Done directly without going through history, e.g. created as Done)
                var doneDate = lastDoneEntry != null
                    ? DateOnly.FromDateTime(lastDoneEntry.ChangedAt)
                    : DateOnly.FromDateTime(w.UpdatedAt);

                return new { w.Points, Date = doneDate };
            })
            .ToList();

        // Daily actual remaining: start from totalPoints and subtract
        // points of items completed on or before each day.
        for (var date = start; date <= last; date = date.AddDays(1))
        {
            var pointsCompletedByDay = doneDates
                .Where(d => d.Date <= date)
                .Sum(d => d.Points!.Value);

            var actualRemaining = Math.Max(0, totalPoints - pointsCompletedByDay);

            // Ideal: linear from totalPoints on start to 0 on end
            int dayIndex   = date.DayNumber - start.DayNumber;
            var idealRemaining = totalDays > 0
                ? (int)Math.Round(totalPoints * (1.0 - (double)dayIndex / totalDays))
                : 0;

            points.Add(new BurndownPoint
            {
                Date            = date,
                RemainingPoints = actualRemaining,
                IdealPoints     = Math.Max(0, idealRemaining)
            });
        }

        return points;
    }

    // ── Capacity ─────────────────────────────────────────────────────────────

    public async Task<CapacityDto> GetCapacityAsync(
        int teamId, int userId, DateOnly fromDate, DateOnly toDate)
    {
        await EnsureTeamAccessAsync(teamId, userId);

        if (fromDate > toDate)
            throw new InvalidOperationException("fromDate must be before or equal to toDate.");

        // Load team members with their org memberships and absences
        var teamMembers = await _db.TeamMembers
            .Where(tm => tm.TeamId == teamId)
            .Include(tm => tm.OrgMember)
                .ThenInclude(om => om.User)
            .Include(tm => tm.OrgMember)
                .ThenInclude(om => om.Absences)
            .ToListAsync();

        int totalWorkDaysBase = CountWorkDays(fromDate, toDate);
        int totalAbsenceDays  = 0;

        var byMember = new List<MemberCapacityItem>();

        foreach (var tm in teamMembers)
        {
            var member = tm.OrgMember;

            // Sum absence days that overlap with the given range
            var absenceDays = member.Absences
                .Where(a => a.FromDate <= toDate && a.ToDate >= fromDate)
                .Sum(a =>
                {
                    // Clamp absence to the requested range
                    var clampedFrom = a.FromDate < fromDate ? fromDate : a.FromDate;
                    var clampedTo   = a.ToDate   > toDate   ? toDate   : a.ToDate;
                    return CountWorkDays(clampedFrom, clampedTo);
                });

            var workDays      = totalWorkDaysBase;
            var availableDays = Math.Max(0, workDays - absenceDays);

            totalAbsenceDays += absenceDays;

            byMember.Add(new MemberCapacityItem
            {
                MemberId      = tm.Id,
                UserId        = member.UserId,
                Name          = member.User.Name,
                Email         = member.Email,
                AvatarUrl     = member.User.AvatarUrl,
                WorkDays      = workDays,
                AbsenceDays   = absenceDays,
                AvailableDays = availableDays
            });
        }

        // Total capacity across the whole team
        int teamWorkDays      = totalWorkDaysBase * teamMembers.Count;
        int teamAvailableDays = Math.Max(0, teamWorkDays - totalAbsenceDays);

        return new CapacityDto
        {
            FromDate      = fromDate,
            ToDate        = toDate,
            TotalWorkDays = teamWorkDays,
            AbsenceDays   = totalAbsenceDays,
            AvailableDays = teamAvailableDays,
            ByMember      = byMember
        };
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /// <summary>
    /// Counts Monday–Friday days in an inclusive date range.
    /// </summary>
    private static int CountWorkDays(DateOnly from, DateOnly to)
    {
        if (from > to) return 0;

        int count = 0;
        for (var d = from; d <= to; d = d.AddDays(1))
        {
            var dow = d.DayOfWeek;
            if (dow != DayOfWeek.Saturday && dow != DayOfWeek.Sunday)
                count++;
        }
        return count;
    }

    /// <summary>
    /// Throws UnauthorizedAccessException if the requesting user is not a
    /// member of the organisation that owns the team.
    /// </summary>
    private async Task EnsureTeamAccessAsync(int teamId, int userId)
    {
        var team = await _db.Teams
            .Include(t => t.Product)
            .FirstOrDefaultAsync(t => t.Id == teamId)
            ?? throw new KeyNotFoundException($"Team {teamId} not found.");

        var isMember = await _db.OrganizationMembers
            .AnyAsync(om =>
                om.OrganizationId == team.Product.OrganizationId &&
                om.UserId         == userId &&
                om.Status         == OrgMemberStatus.Active);

        if (!isMember)
            throw new UnauthorizedAccessException("You do not have access to this team.");
    }
}
