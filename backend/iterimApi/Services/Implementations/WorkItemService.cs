using iterimApi.Data;
using iterimApi.DTOs.Tags;
using iterimApi.DTOs.Teams;
using iterimApi.DTOs.WorkItems;
using iterimApi.Exceptions;
using iterimApi.Models.Entities;
using iterimApi.Models.Enums;
using iterimApi.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace iterimApi.Services.Implementations;

public class WorkItemService : IWorkItemService
{
    private readonly AppDbContext _db;
    private readonly IWorkItemDependencyService _dependencyService;

    public WorkItemService(AppDbContext db, IWorkItemDependencyService dependencyService)
    {
        _db = db;
        _dependencyService = dependencyService;
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
            .Include(wi => wi.Tags)
                .ThenInclude(wit => wit.Tag)
            .Include(wi => wi.BlockedBy)
            .Include(wi => wi.Blocks)
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
            .Include(wi => wi.Tags)
                .ThenInclude(wit => wit.Tag)
            .Include(wi => wi.BlockedBy)
            .Include(wi => wi.Blocks)
            .OrderBy(wi => wi.Position)
            .ThenByDescending(wi => wi.CreatedAt)
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
            .Include(wi => wi.Tags)
                .ThenInclude(wit => wit.Tag)
            .Include(wi => wi.BlockedBy)
            .Include(wi => wi.Blocks)
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

        var maxPosition = await _db.WorkItems
            .Where(wi => wi.TeamId == teamId && wi.IterationId == null)
            .MaxAsync(wi => (int?)wi.Position) ?? -1;
        workItem.Position = maxPosition + 1;

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

        // Resolve the OrgMemberId of the requester (needed for WorkItemHistory.ChangedBy)
        var orgMember = await _db.OrganizationMembers
            .Include(om => om.TeamMemberships)
            .FirstOrDefaultAsync(om =>
                om.UserId == userId &&
                om.TeamMemberships.Any(tm => tm.TeamId == workItem.TeamId));

        if (orgMember == null)
            throw new UnauthorizedAccessException("User is not a member of this team");

        // Block transition to InProgress if there are unfinished blockers
        if (dto.Status == WorkItemStatus.InProgress && workItem.Status != WorkItemStatus.InProgress)
        {
            var unfinishedBlockers = await _dependencyService.GetUnfinishedBlockersAsync(workItem.Id);
            if (unfinishedBlockers.Count > 0)
                throw new BlockedByDependenciesException(unfinishedBlockers);
        }

        // Track changes and build history entries before mutating the entity
        var historyEntries = BuildHistoryEntries(workItem, dto, orgMember.Id);

        // Update fields
        workItem.Title = dto.Title;
        if (dto.Type.HasValue)
            workItem.Type = dto.Type.Value;
        workItem.Description = dto.Description;
        workItem.Priority = dto.Priority;
        workItem.Points = dto.Points;
        workItem.Status = dto.Status;
        workItem.AssignedTo = dto.AssignedTo;
        workItem.IterationId = dto.IterationId;
        workItem.UpdatedBy = userId;
        workItem.UpdatedAt = DateTime.UtcNow;

        if (historyEntries.Count > 0)
            _db.WorkItemHistories.AddRange(historyEntries);

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

    public async Task ReorderWorkItemsAsync(int teamId, ReorderWorkItemsDto dto, int userId)
    {
        await EnsureTeamMember(teamId, userId);

        var itemIds = dto.Items.Select(i => i.Id).ToList();

        var workItems = await _db.WorkItems
            .Where(wi => wi.TeamId == teamId && itemIds.Contains(wi.Id))
            .ToListAsync();

        if (workItems.Count != itemIds.Count)
            throw new InvalidOperationException("Some work items were not found in this team");

        foreach (var wi in workItems)
        {
            var update = dto.Items.First(i => i.Id == wi.Id);
            wi.Position = update.Position;
            wi.UpdatedAt = DateTime.UtcNow;
            wi.UpdatedBy = userId;
        }

        await _db.SaveChangesAsync();
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

    /// <summary>
    /// Compares the current WorkItem state against the incoming DTO and returns
    /// a history entry for every field that actually changed.
    /// Only tracked fields: Status, Priority, Points, AssignedTo, IterationId, Title.
    /// </summary>
    private static List<WorkItemHistory> BuildHistoryEntries(
        WorkItem current, UpdateWorkItemDto incoming, int orgMemberId)
    {
        var entries = new List<WorkItemHistory>();
        var now = DateTime.UtcNow;

        void Add(string field, string? oldVal, string? newVal)
        {
            if (oldVal == newVal) return;
            entries.Add(new WorkItemHistory
            {
                WorkItemId = current.Id,
                FieldName = field,
                OldValue = oldVal,
                NewValue = newVal,
                ChangedAt = now,
                ChangedBy = orgMemberId
            });
        }

        Add("Status", current.Status.ToString(), incoming.Status.ToString());
        Add("Priority", current.Priority.ToString(), incoming.Priority.ToString());
        Add("Points", current.Points?.ToString(), incoming.Points?.ToString());
        Add("AssignedTo", current.AssignedTo?.ToString(), incoming.AssignedTo?.ToString());
        Add("IterationId", current.IterationId?.ToString(), incoming.IterationId?.ToString());
        Add("Title", current.Title, incoming.Title);

        return entries;
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
            Position = wi.Position,
            CreatedAt = wi.CreatedAt,
            UpdatedAt = wi.UpdatedAt,
            CreatedBy = wi.CreatedBy,
            UpdatedBy = wi.UpdatedBy,
            CreatedByName = wi.CreatedByUser.Name,
            UpdatedByName = wi.UpdatedByUser.Name,
            AssignedMember = assignedMemberDto,
            Tags = wi.Tags.Select(wit => new TagDto
            {
                Id = wit.Tag.Id,
                OrganizationId = wit.Tag.OrganizationId,
                Name = wit.Tag.Name,
                Color = wit.Tag.Color,
                CreatedAt = wit.Tag.CreatedAt
            }).ToList(),
            BlockerCount = wi.BlockedBy.Count,
            BlocksCount = wi.Blocks.Count
        };
    }
}
