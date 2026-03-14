using iterimApi.Data;
using iterimApi.DTOs.Iterations;
using iterimApi.Models.Entities;
using iterimApi.Models.Enums;
using iterimApi.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace iterimApi.Services.Implementations;

public class IterationService : IIterationService
{
    private readonly AppDbContext _db;

    public IterationService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<IEnumerable<IterationDto>> GetIterationsByTeamAsync(int teamId, int userId)
    {
        await EnsureTeamMember(teamId, userId);

        var iterations = await _db.Iterations
            .Where(i => i.TeamId == teamId)
            .Include(i => i.CreatedByUser)
            .Include(i => i.UpdatedByUser)
            .Include(i => i.WorkItems)
            .OrderByDescending(i => i.StartDate)
            .ToListAsync();

        return iterations.Select(MapToDto);
    }

    public async Task<IterationDto?> GetIterationByIdAsync(int id, int userId)
    {
        var iteration = await _db.Iterations
            .Include(i => i.CreatedByUser)
            .Include(i => i.UpdatedByUser)
            .Include(i => i.WorkItems)
            .FirstOrDefaultAsync(i => i.Id == id);

        if (iteration == null)
            return null;

        await EnsureTeamMember(iteration.TeamId, userId);

        return MapToDto(iteration);
    }

    public async Task<IterationDto?> CreateIterationAsync(int teamId, CreateIterationDto dto, int userId)
    {
        await EnsureTeamMember(teamId, userId);

        // Get default iteration length from OrgConfig
        var defaultLengthDays = await GetDefaultIterationLengthDays(teamId);

        var startDate = dto.StartDate ?? DateOnly.FromDateTime(DateTime.UtcNow);
        var endDate = dto.EndDate ?? startDate.AddDays(defaultLengthDays);

        if (endDate <= startDate)
            throw new InvalidOperationException("EndDate must be after StartDate");

        var iteration = new Iteration
        {
            TeamId = teamId,
            Name = dto.Name,
            StartDate = startDate,
            EndDate = endDate,
            Goal = dto.Goal,
            Status = IterationStatus.Planning,
            CreatedBy = userId,
            UpdatedBy = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _db.Iterations.Add(iteration);
        await _db.SaveChangesAsync();

        // Load nav properties for DTO
        await _db.Entry(iteration).Reference(i => i.CreatedByUser).LoadAsync();
        await _db.Entry(iteration).Reference(i => i.UpdatedByUser).LoadAsync();
        await _db.Entry(iteration).Collection(i => i.WorkItems).LoadAsync();

        return MapToDto(iteration);
    }

    public async Task<IterationDto?> UpdateIterationAsync(int id, UpdateIterationDto dto, int userId)
    {
        var iteration = await _db.Iterations
            .Include(i => i.CreatedByUser)
            .Include(i => i.WorkItems)
            .FirstOrDefaultAsync(i => i.Id == id);

        if (iteration == null)
            return null;

        await EnsureTeamMember(iteration.TeamId, userId);

        if (iteration.Status == IterationStatus.Completed)
            throw new InvalidOperationException("Cannot edit a completed iteration");

        if (dto.EndDate <= dto.StartDate)
            throw new InvalidOperationException("EndDate must be after StartDate");

        iteration.Name = dto.Name;
        iteration.StartDate = dto.StartDate;
        iteration.EndDate = dto.EndDate;
        iteration.Goal = dto.Goal;
        iteration.UpdatedBy = userId;
        iteration.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        await _db.Entry(iteration).Reference(i => i.UpdatedByUser).LoadAsync();

        return MapToDto(iteration);
    }

    public async Task<IterationDto?> StartIterationAsync(int id, int userId)
    {
        var iteration = await _db.Iterations
            .Include(i => i.CreatedByUser)
            .Include(i => i.UpdatedByUser)
            .Include(i => i.WorkItems)
            .FirstOrDefaultAsync(i => i.Id == id);

        if (iteration == null)
            return null;

        await EnsureTeamMember(iteration.TeamId, userId);

        if (iteration.Status != IterationStatus.Planning)
            throw new InvalidOperationException("Only iterations in Planning status can be started");

        // Check no other Active iteration exists for this team
        var hasActive = await _db.Iterations
            .AnyAsync(i => i.TeamId == iteration.TeamId &&
                           i.Status == IterationStatus.Active &&
                           i.Id != id);

        if (hasActive)
            throw new InvalidOperationException("Another iteration is already active for this team. Complete it before starting a new one.");

        iteration.Status = IterationStatus.Active;
        iteration.UpdatedBy = userId;
        iteration.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return MapToDto(iteration);
    }

    public async Task<IterationDto?> CompleteIterationAsync(int id, int userId, int? moveUnfinishedToIterationId = null)
    {
        var iteration = await _db.Iterations
            .Include(i => i.CreatedByUser)
            .Include(i => i.UpdatedByUser)
            .Include(i => i.WorkItems)
            .FirstOrDefaultAsync(i => i.Id == id);

        if (iteration == null)
            return null;

        await EnsureTeamMember(iteration.TeamId, userId);

        if (iteration.Status != IterationStatus.Active)
            throw new InvalidOperationException("Only active iterations can be completed");

        iteration.Status = IterationStatus.Completed;

        // Move unfinished work items (anything not Done)
        var unfinishedItems = iteration.WorkItems
            .Where(wi => wi.Status != WorkItemStatus.Done)
            .ToList();

        if (moveUnfinishedToIterationId.HasValue)
        {
            // Validate target iteration belongs to same team
            var targetExists = await _db.Iterations
                .AnyAsync(i => i.Id == moveUnfinishedToIterationId.Value &&
                               i.TeamId == iteration.TeamId &&
                               i.Status != IterationStatus.Completed);

            if (!targetExists)
                throw new InvalidOperationException("Target iteration not found or already completed");
        }

        foreach (var wi in unfinishedItems)
        {
            wi.IterationId = moveUnfinishedToIterationId; // null = back to backlog
            wi.UpdatedBy = userId;
            wi.UpdatedAt = DateTime.UtcNow;
        }

        iteration.UpdatedBy = userId;
        iteration.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return MapToDto(iteration);
    }

    public async Task<bool> DeleteIterationAsync(int id, int userId)
    {
        var iteration = await _db.Iterations
            .Include(i => i.WorkItems)
            .FirstOrDefaultAsync(i => i.Id == id);

        if (iteration == null)
            return false;

        await EnsureTeamMember(iteration.TeamId, userId);

        if (iteration.Status == IterationStatus.Active)
            throw new InvalidOperationException("Cannot delete an active iteration. Complete it first.");

        // Unassign all work items from this iteration (move back to backlog)
        foreach (var wi in iteration.WorkItems)
        {
            wi.IterationId = null;
            wi.UpdatedBy = userId;
            wi.UpdatedAt = DateTime.UtcNow;
        }

        _db.Iterations.Remove(iteration);
        await _db.SaveChangesAsync();

        return true;
    }

    // ── Private helpers ──────────────────────────────────────

    /// <summary>
    /// Gets the default iteration length from OrganizationConfig.
    /// Falls back to 14 days if no config exists.
    /// Path: Team → Product → Organization → Config
    /// </summary>
    private async Task<int> GetDefaultIterationLengthDays(int teamId)
    {
        var config = await _db.Teams
            .Where(t => t.Id == teamId)
            .Select(t => t.Product.Organization.Config)
            .FirstOrDefaultAsync();

        return config?.IterationLengthDays ?? 14;
    }

    /// <summary>
    /// Verifies that the user is a member of the team.
    /// </summary>
    private async Task EnsureTeamMember(int teamId, int userId)
    {
        var team = await _db.Teams
            .FirstOrDefaultAsync(t => t.Id == teamId);

        if (team == null)
            throw new KeyNotFoundException("Team not found");

        var isTeamMember = await _db.TeamMembers
            .AnyAsync(tm => tm.TeamId == teamId &&
                            tm.OrgMember.UserId == userId);

        if (!isTeamMember)
            throw new UnauthorizedAccessException("User is not a member of this team");
    }

    private static IterationDto MapToDto(Iteration i)
    {
        return new IterationDto
        {
            Id = i.Id,
            TeamId = i.TeamId,
            Name = i.Name,
            StartDate = i.StartDate,
            EndDate = i.EndDate,
            Goal = i.Goal,
            Status = i.Status.ToString(),
            CreatedAt = i.CreatedAt,
            UpdatedAt = i.UpdatedAt,
            CreatedBy = i.CreatedBy,
            UpdatedBy = i.UpdatedBy,
            CreatedByName = i.CreatedByUser.Name,
            UpdatedByName = i.UpdatedByUser.Name,
            WorkItemCount = i.WorkItems.Count,
            TotalPoints = i.WorkItems.Sum(wi => wi.Points ?? 0)
        };
    }
}
