using iterimApi.Data;
using iterimApi.DTOs.Tags;
using iterimApi.DTOs.Teams;
using iterimApi.DTOs.WorkItems;
using iterimApi.Models.Entities;
using iterimApi.Models.Enums;
using iterimApi.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace iterimApi.Services.Implementations;

public class WorkItemDependencyService : IWorkItemDependencyService
{
    private readonly AppDbContext _db;

    public WorkItemDependencyService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<WorkItemDependenciesDto> GetDependenciesAsync(int workItemId, int userId)
    {
        await EnsureOrgMember(workItemId, userId);

        var blocks = await _db.WorkItemDependencies
            .Where(d => d.BlockerWorkItemId == workItemId)
            .Include(d => d.BlockedWorkItem)
                .ThenInclude(wi => wi.Team)
                .ThenInclude(t => t.Product)
                .ThenInclude(p => p.Organization)
            .Include(d => d.BlockedWorkItem)
                .ThenInclude(wi => wi.AssignedMember)
                .ThenInclude(m => m!.OrgMember)
                .ThenInclude(om => om.User)
            .Include(d => d.BlockedWorkItem)
                .ThenInclude(wi => wi.Tags)
                .ThenInclude(wit => wit.Tag)
            .ToListAsync();

        var blockedBy = await _db.WorkItemDependencies
            .Where(d => d.BlockedWorkItemId == workItemId)
            .Include(d => d.BlockerWorkItem)
                .ThenInclude(wi => wi.Team)
                .ThenInclude(t => t.Product)
                .ThenInclude(p => p.Organization)
            .Include(d => d.BlockerWorkItem)
                .ThenInclude(wi => wi.AssignedMember)
                .ThenInclude(m => m!.OrgMember)
                .ThenInclude(om => om.User)
            .Include(d => d.BlockerWorkItem)
                .ThenInclude(wi => wi.Tags)
                .ThenInclude(wit => wit.Tag)
            .ToListAsync();

        return new WorkItemDependenciesDto
        {
            Blocks = blocks.Select(d => MapToDto(d.Id, d.BlockedWorkItem)).ToList(),
            BlockedBy = blockedBy.Select(d => MapToDto(d.Id, d.BlockerWorkItem)).ToList()
        };
    }

    public async Task<WorkItemDependencyDto> AddDependencyAsync(int workItemId, int blockerWorkItemId, int userId)
    {
        var orgMember = await GetOrgMember(userId)
            ?? throw new UnauthorizedAccessException("User is not an organization member");

        var workItem = await _db.WorkItems.FindAsync(workItemId)
            ?? throw new KeyNotFoundException("Work item not found");

        var blocker = await _db.WorkItems.FindAsync(blockerWorkItemId)
            ?? throw new KeyNotFoundException("Blocker work item not found");

        if (workItemId == blockerWorkItemId)
            throw new InvalidOperationException("A work item cannot block itself");

        var duplicate = await _db.WorkItemDependencies
            .AnyAsync(d => d.BlockerWorkItemId == blockerWorkItemId && d.BlockedWorkItemId == workItemId);
        if (duplicate)
            throw new InvalidOperationException("This dependency already exists");

        // Check: from workItemId, following Blocks edges, can we reach blockerWorkItemId?
        // If yes, adding blockerWorkItemId→workItemId would create a cycle.
        if (await HasCycleAsync(workItemId, blockerWorkItemId))
            throw new InvalidOperationException("Adding this dependency would create a circular dependency");

        var dependency = new WorkItemDependency
        {
            BlockerWorkItemId = blockerWorkItemId,
            BlockedWorkItemId = workItemId,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = orgMember.Id
        };

        _db.WorkItemDependencies.Add(dependency);
        await _db.SaveChangesAsync();

        await _db.Entry(dependency).Reference(d => d.BlockerWorkItem).LoadAsync();
        await _db.Entry(dependency.BlockerWorkItem).Reference(wi => wi.Team).LoadAsync();
        await _db.Entry(dependency.BlockerWorkItem.Team).Reference(t => t.Product).LoadAsync();
        await _db.Entry(dependency.BlockerWorkItem.Team.Product).Reference(p => p.Organization).LoadAsync();
        await _db.Entry(dependency.BlockerWorkItem).Collection(wi => wi.Tags).Query()
            .Include(wit => wit.Tag).LoadAsync();

        if (dependency.BlockerWorkItem.AssignedTo.HasValue)
        {
            await _db.Entry(dependency.BlockerWorkItem).Reference(wi => wi.AssignedMember).LoadAsync();
            if (dependency.BlockerWorkItem.AssignedMember != null)
            {
                await _db.Entry(dependency.BlockerWorkItem.AssignedMember).Reference(m => m.OrgMember).LoadAsync();
                await _db.Entry(dependency.BlockerWorkItem.AssignedMember.OrgMember).Reference(om => om.User).LoadAsync();
            }
        }

        return MapToDto(dependency.Id, dependency.BlockerWorkItem);
    }

    public async Task RemoveDependencyAsync(int dependencyId, int userId)
    {
        var orgMember = await GetOrgMember(userId)
            ?? throw new UnauthorizedAccessException("User is not an organization member");

        var dependency = await _db.WorkItemDependencies.FindAsync(dependencyId)
            ?? throw new KeyNotFoundException("Dependency not found");

        _db.WorkItemDependencies.Remove(dependency);
        await _db.SaveChangesAsync();
    }

    public async Task<List<WorkItemDependencyDto>> GetUnfinishedBlockersAsync(int workItemId)
    {
        var blockers = await _db.WorkItemDependencies
            .Where(d => d.BlockedWorkItemId == workItemId && d.BlockerWorkItem.Status != WorkItemStatus.Done)
            .Include(d => d.BlockerWorkItem)
                .ThenInclude(wi => wi.Team)
                .ThenInclude(t => t.Product)
                .ThenInclude(p => p.Organization)
            .Include(d => d.BlockerWorkItem)
                .ThenInclude(wi => wi.AssignedMember)
                .ThenInclude(m => m!.OrgMember)
                .ThenInclude(om => om.User)
            .Include(d => d.BlockerWorkItem)
                .ThenInclude(wi => wi.Tags)
                .ThenInclude(wit => wit.Tag)
            .ToListAsync();

        return blockers.Select(d => MapToDto(d.Id, d.BlockerWorkItem)).ToList();
    }

    public async Task<IEnumerable<WorkItemDto>> SearchWorkItemsAsync(string query, int userId)
    {
        var teamIds = await _db.TeamMembers
            .Where(tm => tm.OrgMember.UserId == userId)
            .Select(tm => tm.TeamId)
            .ToListAsync();

        var workItems = await _db.WorkItems
            .Where(wi => teamIds.Contains(wi.TeamId) &&
                         wi.Title.Contains(query))
            .Include(wi => wi.Team)
            .Include(wi => wi.CreatedByUser)
            .Include(wi => wi.UpdatedByUser)
            .Include(wi => wi.AssignedMember)
                .ThenInclude(m => m!.OrgMember)
                .ThenInclude(om => om.User)
            .Include(wi => wi.Tags)
                .ThenInclude(wit => wit.Tag)
            .Include(wi => wi.BlockedBy)
            .Include(wi => wi.Blocks)
            .OrderBy(wi => wi.Title)
            .Take(20)
            .ToListAsync();

        return workItems.Select(wi =>
        {
            var dto = MapWorkItemToDto(wi);
            dto.TeamName = wi.Team.Name;
            return dto;
        });
    }

    // ── Private helpers ──────────────────────────────────────

    private async Task<bool> HasCycleAsync(int startId, int targetId)
    {
        // DFS: from startId, follow "Blocks" edges; if we reach targetId → cycle
        var visited = new HashSet<int>();
        var stack = new Stack<int>();
        stack.Push(startId);

        while (stack.Count > 0)
        {
            var current = stack.Pop();
            if (current == targetId) return true;
            if (!visited.Add(current)) continue;

            var blockedIds = await _db.WorkItemDependencies
                .Where(d => d.BlockerWorkItemId == current)
                .Select(d => d.BlockedWorkItemId)
                .ToListAsync();

            foreach (var id in blockedIds)
                stack.Push(id);
        }

        return false;
    }

    private async Task EnsureOrgMember(int workItemId, int userId)
    {
        var workItem = await _db.WorkItems
            .Include(wi => wi.Team)
                .ThenInclude(t => t.Product)
            .FirstOrDefaultAsync(wi => wi.Id == workItemId)
            ?? throw new KeyNotFoundException("Work item not found");

        var isOrgMember = await _db.OrganizationMembers
            .AnyAsync(om => om.UserId == userId && om.OrganizationId == workItem.Team.Product.OrganizationId);

        if (!isOrgMember)
            throw new UnauthorizedAccessException("User is not an organization member");
    }

    private async Task<OrganizationMember?> GetOrgMember(int userId)
    {
        return await _db.OrganizationMembers
            .FirstOrDefaultAsync(om => om.UserId == userId);
    }

    private static WorkItemDependencyDto MapToDto(int dependencyId, WorkItem wi)
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
                Role = wi.AssignedMember.Role.ToString()
            };
        }

        return new WorkItemDependencyDto
        {
            DependencyId = dependencyId,
            WorkItemId = wi.Id,
            Title = wi.Title,
            Status = wi.Status.ToString(),
            Type = wi.Type.ToString(),
            Description = wi.Description,
            Points = wi.Points,
            TeamId = wi.TeamId,
            TeamName = wi.Team.Name,
            ProductId = wi.Team.ProductId,
            ProductName = wi.Team.Product.Name,
            OrgId = wi.Team.Product.OrganizationId,
            AssignedMember = assignedMemberDto,
            Tags = wi.Tags.Select(wit => new TagDto
            {
                Id = wit.Tag.Id,
                OrganizationId = wit.Tag.OrganizationId,
                Name = wit.Tag.Name,
                Color = wit.Tag.Color,
                CreatedAt = wit.Tag.CreatedAt
            }).ToList(),
            CreatedAt = wi.CreatedAt,
            UpdatedAt = wi.UpdatedAt
        };
    }

    private static WorkItemDto MapWorkItemToDto(WorkItem wi)
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
                Role = wi.AssignedMember.Role.ToString()
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
