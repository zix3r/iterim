using iterimApi.Data;
using iterimApi.DTOs.Teams;
using iterimApi.DTOs.WorkItems;
using iterimApi.Models.Entities;
using iterimApi.Models.Enums;
using iterimApi.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace iterimApi.Services.Implementations;

public class WorkItemService : IWorkItemService
{
    private readonly AppDbContext _db;

    public WorkItemService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<IEnumerable<WorkItemDto>> GetWorkItemsByTeamAsync(int teamId, WorkItemFilterDto filters, int userId)
    {
        await EnsureTeamMember(teamId, userId);

        var query = _db.WorkItems
            .Where(wi => wi.TeamId == teamId)
            .AsQueryable();

        // Apply filters
        if (filters.Type.HasValue)
            query = query.Where(wi => wi.Type == filters.Type.Value);

        if (filters.Status.HasValue)
            query = query.Where(wi => wi.Status == filters.Status.Value);

        if (filters.Priority.HasValue)
            query = query.Where(wi => wi.Priority == filters.Priority.Value);

        if (filters.AssignedTo.HasValue)
            query = query.Where(wi => wi.AssignedTo == filters.AssignedTo.Value);

        if (filters.IterationId.HasValue)
        {
            if (filters.IterationId.Value == 0)
                query = query.Where(wi => wi.IterationId == null); // backlog only
            else
                query = query.Where(wi => wi.IterationId == filters.IterationId.Value);
        }

        var workItems = await query
            .Include(wi => wi.CreatedByUser)
            .Include(wi => wi.UpdatedByUser)
            .Include(wi => wi.AssignedMember)
                .ThenInclude(m => m!.OrgMember)
                .ThenInclude(om => om.User)
            .OrderByDescending(wi => wi.CreatedAt)
            .ToListAsync();

        return workItems.Select(MapToDto);
    }

    public async Task<IEnumerable<BacklogGroupDto>> GetBacklogGroupedByIterationAsync(int teamId, int userId)
    {
        await EnsureTeamMember(teamId, userId);

        var workItems = await _db.WorkItems
            .Where(wi => wi.TeamId == teamId)
            .Include(wi => wi.Iteration)
            .Include(wi => wi.CreatedByUser)
            .Include(wi => wi.UpdatedByUser)
            .Include(wi => wi.AssignedMember)
                .ThenInclude(m => m!.OrgMember)
                .ThenInclude(om => om.User)
            .OrderByDescending(wi => wi.CreatedAt)
            .ToListAsync();

        // Group: null IterationId = "Backlog", rest grouped by iteration
        var groups = workItems
            .GroupBy(wi => wi.IterationId)
            .Select(g =>
            {
                var iteration = g.First().Iteration;
                return new BacklogGroupDto
                {
                    IterationId = g.Key,
                    IterationName = iteration?.Name ?? "Backlog",
                    IterationStatus = iteration?.Status.ToString(),
                    WorkItems = g.Select(MapToDto).ToList()
                };
            })
            .OrderBy(g => g.IterationId == null ? 0 : 1) // Backlog first
            .ThenBy(g => g.IterationName)
            .ToList();

        return groups;
    }

    public async Task<WorkItemDto?> GetWorkItemByIdAsync(int id, int userId)
    {
        var workItem = await _db.WorkItems
            .Include(wi => wi.CreatedByUser)
            .Include(wi => wi.UpdatedByUser)
            .Include(wi => wi.AssignedMember)
                .ThenInclude(m => m!.OrgMember)
                .ThenInclude(om => om.User)
            .FirstOrDefaultAsync(wi => wi.Id == id);

        if (workItem == null)
            return null;

        await EnsureTeamMember(workItem.TeamId, userId);

        return MapToDto(workItem);
    }

    public async Task<WorkItemDto?> CreateWorkItemAsync(int teamId, CreateWorkItemDto dto, int userId)
    {
        await EnsureTeamMember(teamId, userId);

        // Validate AssignedTo is a member of this team
        if (dto.AssignedTo.HasValue)
        {
            var assigneeExists = await _db.TeamMembers
                .AnyAsync(tm => tm.Id == dto.AssignedTo.Value && tm.TeamId == teamId);

            if (!assigneeExists)
                throw new InvalidOperationException("AssignedTo must be a valid team member");
        }

        var workItem = new WorkItem
        {
            TeamId = teamId,
            Title = dto.Title,
            Description = dto.Description,
            Type = dto.Type,
            Priority = dto.Priority,
            Points = dto.Points,
            AssignedTo = dto.AssignedTo,
            Status = WorkItemStatus.Backlog,
            CreatedBy = userId,
            UpdatedBy = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _db.WorkItems.Add(workItem);
        await _db.SaveChangesAsync();

        // Load navigation properties for DTO
        await _db.Entry(workItem).Reference(wi => wi.CreatedByUser).LoadAsync();
        await _db.Entry(workItem).Reference(wi => wi.UpdatedByUser).LoadAsync();

        if (workItem.AssignedTo.HasValue)
        {
            await _db.Entry(workItem).Reference(wi => wi.AssignedMember).LoadAsync();
            if (workItem.AssignedMember != null)
            {
                await _db.Entry(workItem.AssignedMember).Reference(m => m.OrgMember).LoadAsync();
                await _db.Entry(workItem.AssignedMember.OrgMember).Reference(om => om.User).LoadAsync();
            }
        }

        return MapToDto(workItem);
    }

    public async Task<WorkItemDto?> UpdateWorkItemAsync(int id, UpdateWorkItemDto dto, int userId)
    {
        var workItem = await _db.WorkItems
            .Include(wi => wi.CreatedByUser)
            .FirstOrDefaultAsync(wi => wi.Id == id);

        if (workItem == null)
            return null;

        await EnsureTeamMember(workItem.TeamId, userId);

        // Validate AssignedTo if provided
        if (dto.AssignedTo.HasValue)
        {
            var assigneeExists = await _db.TeamMembers
                .AnyAsync(tm => tm.Id == dto.AssignedTo.Value && tm.TeamId == workItem.TeamId);

            if (!assigneeExists)
                throw new InvalidOperationException("AssignedTo must be a valid team member");
        }

        // Validate IterationId if provided
        if (dto.IterationId.HasValue)
        {
            var iterationExists = await _db.Iterations
                .AnyAsync(i => i.Id == dto.IterationId.Value && i.TeamId == workItem.TeamId);

            if (!iterationExists)
                throw new InvalidOperationException("IterationId must be a valid iteration for this team");
        }

        // Update fields
        workItem.Title = dto.Title;
        workItem.Description = dto.Description;
        workItem.Priority = dto.Priority;
        workItem.Points = dto.Points;
        workItem.Status = dto.Status;
        workItem.AssignedTo = dto.AssignedTo;
        workItem.IterationId = dto.IterationId;
        workItem.UpdatedBy = userId;
        workItem.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        // Reload nav properties for response
        await _db.Entry(workItem).Reference(wi => wi.UpdatedByUser).LoadAsync();

        if (workItem.AssignedTo.HasValue)
        {
            await _db.Entry(workItem).Reference(wi => wi.AssignedMember).LoadAsync();
            if (workItem.AssignedMember != null)
            {
                await _db.Entry(workItem.AssignedMember).Reference(m => m.OrgMember).LoadAsync();
                await _db.Entry(workItem.AssignedMember.OrgMember).Reference(om => om.User).LoadAsync();
            }
        }
        else
        {
            workItem.AssignedMember = null;
        }

        return MapToDto(workItem);
    }

    public async Task<bool> DeleteWorkItemAsync(int id, int userId)
    {
        var workItem = await _db.WorkItems
            .FirstOrDefaultAsync(wi => wi.Id == id);

        if (workItem == null)
            return false;

        await EnsureTeamMember(workItem.TeamId, userId);

        _db.WorkItems.Remove(workItem);
        await _db.SaveChangesAsync();

        return true;
    }

    // ── Private helpers ──────────────────────────────────────

    /// <summary>
    /// Verifies that the user is a member of the team (via TeamMembers → OrgMember → User).
    /// Throws KeyNotFoundException if team doesn't exist.
    /// Throws UnauthorizedAccessException if user is not a team member.
    /// </summary>
    private async Task EnsureTeamMember(int teamId, int userId)
    {
        var team = await _db.Teams
            .Include(t => t.Product)
            .FirstOrDefaultAsync(t => t.Id == teamId);

        if (team == null)
            throw new KeyNotFoundException("Team not found");

        var isTeamMember = await _db.TeamMembers
            .AnyAsync(tm => tm.TeamId == teamId &&
                            tm.OrgMember.UserId == userId);

        if (!isTeamMember)
            throw new UnauthorizedAccessException("User is not a member of this team");
    }

    private static WorkItemDto MapToDto(WorkItem wi)
    {
        TeamMemberDto? assignedMemberDto = null;

        if (wi.AssignedMember != null)
        {
            assignedMemberDto = new TeamMemberDto
            {
                Id = wi.AssignedMember.Id,
                TeamId = wi.AssignedMember.TeamId,
                OrgMemberId = wi.AssignedMember.OrgMemberId,
                UserId = wi.AssignedMember.OrgMember.UserId,
                UserName = wi.AssignedMember.OrgMember.User.Name,
                UserEmail = wi.AssignedMember.OrgMember.User.Email,
                Role = wi.AssignedMember.Role.ToString(),
                CreatedAt = wi.AssignedMember.CreatedAt
            };
        }

        return new WorkItemDto
        {
            Id = wi.Id,
            TeamId = wi.TeamId,
            IterationId = wi.IterationId,
            AssignedTo = wi.AssignedTo,
            Title = wi.Title,
            Description = wi.Description,
            Points = wi.Points,
            Type = wi.Type.ToString(),
            Priority = wi.Priority.ToString(),
            Status = wi.Status.ToString(),
            CreatedAt = wi.CreatedAt,
            UpdatedAt = wi.UpdatedAt,
            CreatedBy = wi.CreatedBy,
            UpdatedBy = wi.UpdatedBy,
            CreatedByName = wi.CreatedByUser.Name,
            UpdatedByName = wi.UpdatedByUser.Name,
            AssignedMember = assignedMemberDto
        };
    }
}
