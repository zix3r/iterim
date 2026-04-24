using iterimApi.Data;
using iterimApi.DTOs.Dashboard;
using iterimApi.Services.Interfaces;
using iterimApi.Models.Enums;
using Microsoft.EntityFrameworkCore;

namespace iterimApi.Services.Implementations;

public class DashboardService : IDashboardService
{
    private readonly AppDbContext _context;

    public DashboardService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<DashboardDto> GetDashboardAsync(int userId)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        // 1. Get Hierarchy (Orgs -> Products -> Teams -> Active Sprint)
        var organizations = await _context.Organizations
            .AsNoTracking()
            .Where(o => o.Members.Any(m => m.UserId == userId && m.Status == OrgMemberStatus.Active))
            .Include(o => o.Products)
                .ThenInclude(p => p.Teams)
                     .ThenInclude(t => t.Iterations.Where(i => i.StartDate <= today && i.EndDate >= today)) // Filter for active iteration
            .Include(o => o.Products)
                .ThenInclude(p => p.Teams)
                    .ThenInclude(t => t.WorkItems) // Needed for progress calculation if not stored on Iteration
            .Include(o => o.Members) // For member count
            .ToListAsync();

        var dashboardOrgs = organizations.Select(o => new DashboardOrganizationDto
        {
            Id = o.Id,
            Name = o.Name,
            Slug = o.Slug,
            MemberCount = o.Members.Count(m => m.Status == OrgMemberStatus.Active),
            Products = o.Products.Select(p => new DashboardProductDto
            {
                Id = p.Id,
                Name = p.Name,
                Teams = p.Teams.Select(t => {
                    var activeSprint = t.Iterations.FirstOrDefault();
                    DashboardSprintDto? sprintDto = null;

                    if (activeSprint != null)
                    {
                        // Calculate progress
                        // We need work items for this sprint.
                        // The Include above t.WorkItems gets ALL work items for the team.
                        // We need work items for the specific iteration.
                        var sprintItems = t.WorkItems.Where(w => w.IterationId == activeSprint.Id).ToList();
                        var totalPoints = sprintItems.Sum(w => w.Points ?? 0);
                        var completedPoints = sprintItems.Where(w => w.Status == WorkItemStatus.Done).Sum(w => w.Points ?? 0);
                        var byStatus = sprintItems
                            .GroupBy(w => w.Status.ToString())
                            .ToDictionary(g => g.Key, g => g.Count());
                        
                        // Avoid division by zero
                        double progress = totalPoints > 0 ? (double)completedPoints / totalPoints * 100 : 0;
                        
                        // Days Left
                        var daysLeft = activeSprint.EndDate.DayNumber - today.DayNumber;

                        sprintDto = new DashboardSprintDto
                        {
                            Id = activeSprint.Id,
                            Name = activeSprint.Name ?? "Active Sprint",
                            EndDate = activeSprint.EndDate.ToString("yyyy-MM-dd"),
                            DaysLeft = Math.Max(0, daysLeft),
                            TotalPoints = totalPoints,
                            CompletedPoints = completedPoints,
                            Progress = progress,
                            ByStatus = byStatus
                        };
                    }

                    return new DashboardTeamDto
                    {
                        Id = t.Id,
                        Name = t.Name,
                        ActiveSprint = sprintDto
                    };
                }).ToList()
            }).ToList()
        }).ToList();

        // 2. My Work (Active items)
        // First get all TeamMember IDs for the current user
        var teamMemberIds = await _context.TeamMembers
            .Where(tm => tm.OrgMember.UserId == userId)
            .Select(tm => tm.Id)
            .ToListAsync();

        var myWork = await _context.WorkItems
            .AsNoTracking()
            .Include(w => w.Team).ThenInclude(t => t.Product).ThenInclude(p => p.Organization)
            .Include(w => w.Iteration)
            .Where(w => w.AssignedTo != null && teamMemberIds.Contains(w.AssignedTo.Value) && w.Status != WorkItemStatus.Done)
            // Only show items in active iterations or valid date range
            .Where(w => w.Iteration != null && (w.Iteration.Status == IterationStatus.Active || (w.Iteration.StartDate <= today && w.Iteration.EndDate >= today)))
            .OrderByDescending(w => w.UpdatedAt)
            .Take(10)
            .Select(w => new DashboardWorkItemDto
            {
                Id = w.Id,
                Title = w.Title,
                Type = (int)w.Type,
                TypeName = w.Type.ToString(),
                Status = (int)w.Status,
                StatusName = w.Status.ToString(),
                Priority = (int)w.Priority,
                PriorityName = w.Priority.ToString(),
                Points = w.Points,
                OrganizationId = w.Team.Product.OrganizationId,
                OrganizationName = w.Team.Product.Organization.Name,
                ProductId = w.Team.ProductId,
                ProductName = w.Team.Product.Name,
                TeamId = w.TeamId,
                TeamName = w.Team.Name
            })
            .ToListAsync();

        // 3. Recent Activity
        // Find recent history items in user's organizations
        // We need the org IDs first
        var orgIds = organizations.Select(o => o.Id).ToList();

        // Assuming WorkItemHistory has ChangedByMember -> OrganizationMember -> OrganizationId
        // Or simpler: WorkItem -> Team -> Product -> OrganizationId
        var recentActivity = await _context.WorkItems
            .AsNoTracking()
            .Include(w => w.Team).ThenInclude(t => t.Product)
            .Include(w => w.CreatedByUser)
            .Where(w => orgIds.Contains(w.Team.Product.OrganizationId))
            .OrderByDescending(w => w.CreatedAt)
            .Take(10)
            .Select(w => new DashboardActivityDto
            {
                Id = w.Id,
                WorkItemId = w.Id,
                WorkItemTitle = w.Title,
                WorkItemType = w.Type.ToString(),
                Description = "created a new item",
                Timestamp = w.CreatedAt,
                ActorName = w.CreatedByUser.Name ?? "User",
                Type = "Create",
                OrganizationId = w.Team.Product.OrganizationId,
                ProductId = w.Team.ProductId,
                TeamId = w.TeamId
            })
            .ToListAsync();

        return new DashboardDto
        {
            Organizations = dashboardOrgs,
            MyWork = myWork,
            RecentActivity = recentActivity
        };
    }
}
