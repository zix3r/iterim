using iterimApi.Data;
using iterimApi.Exceptions;
using iterimApi.Models.Entities;
using iterimApi.Models.Enums;
using iterimApi.Services.Implementations;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace iterimApi.Tests;

public class WorkItemDependencyTests
{
    // ── Fixtures ──────────────────────────────────────────────

    private static AppDbContext CreateDb()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }

    private static WorkItemDependencyService CreateDepService(AppDbContext db) => new(db);

    private static WorkItemService CreateWorkItemService(AppDbContext db)
    {
        var depService = new WorkItemDependencyService(db);
        var notifications = new NotificationService(db, NullLogger<NotificationService>.Instance);
        return new WorkItemService(db, depService, notifications);
    }

    private static async Task<(Organization org, Product product, Team team, User user, OrganizationMember orgMember, TeamMember teamMember)>
        SeedBasic(AppDbContext db)
    {
        var user = new User { Name = "User", Email = "user@test.com", Role = UserRole.User };
        db.Users.Add(user);
        await db.SaveChangesAsync();

        var org = new Organization { Name = "Org", Slug = "org-1", CreatedBy = user.Id, UpdatedBy = user.Id };
        db.Organizations.Add(org);
        await db.SaveChangesAsync();

        var orgMember = new OrganizationMember
        {
            OrganizationId = org.Id, UserId = user.Id, Email = user.Email,
            Role = OrgMemberRole.Admin, Status = OrgMemberStatus.Active
        };
        db.OrganizationMembers.Add(orgMember);
        await db.SaveChangesAsync();

        var product = new Product { OrganizationId = org.Id, Name = "Product", CreatedBy = user.Id, UpdatedBy = user.Id };
        db.Products.Add(product);
        await db.SaveChangesAsync();

        var team = new Team { ProductId = product.Id, Name = "Team", CreatedBy = user.Id, UpdatedBy = user.Id };
        db.Teams.Add(team);
        await db.SaveChangesAsync();

        var teamMember = new TeamMember { TeamId = team.Id, OrgMemberId = orgMember.Id, Role = TeamMemberRole.Member, CreatedBy = user.Id, UpdatedBy = user.Id };
        db.TeamMembers.Add(teamMember);
        await db.SaveChangesAsync();

        return (org, product, team, user, orgMember, teamMember);
    }

    private static WorkItem MakeWorkItem(int teamId, int createdBy, string title = "Task", WorkItemStatus status = WorkItemStatus.Todo)
        => new() { TeamId = teamId, Title = title, Status = status, Type = WorkItemType.Task, Priority = WorkItemPriority.Medium, CreatedBy = createdBy, UpdatedBy = createdBy };

    // ── AddDependency ──────────────────────────────────────────

    [Fact]
    public async Task AddDependency_OneBlockerBlocksOneItem()
    {
        using var db = CreateDb();
        var svc = CreateDepService(db);
        var (_, _, team, user, orgMember, _) = await SeedBasic(db);

        var blocker = MakeWorkItem(team.Id, user.Id, "Blocker");
        var blocked = MakeWorkItem(team.Id, user.Id, "Blocked");
        db.WorkItems.AddRange(blocker, blocked);
        await db.SaveChangesAsync();

        var dep = await svc.AddDependencyAsync(blocked.Id, blocker.Id, user.Id);

        Assert.Equal(blocker.Id, dep.WorkItemId);
        Assert.Equal("Blocker", dep.Title);
    }

    [Fact]
    public async Task AddDependency_OneBlockerBlocksMultipleItems()
    {
        using var db = CreateDb();
        var svc = CreateDepService(db);
        var (_, _, team, user, _, _) = await SeedBasic(db);

        var blocker = MakeWorkItem(team.Id, user.Id, "Blocker");
        var b1 = MakeWorkItem(team.Id, user.Id, "B1");
        var b2 = MakeWorkItem(team.Id, user.Id, "B2");
        db.WorkItems.AddRange(blocker, b1, b2);
        await db.SaveChangesAsync();

        await svc.AddDependencyAsync(b1.Id, blocker.Id, user.Id);
        await svc.AddDependencyAsync(b2.Id, blocker.Id, user.Id);

        var deps = await db.WorkItemDependencies.ToListAsync();
        Assert.Equal(2, deps.Count);
        Assert.All(deps, d => Assert.Equal(blocker.Id, d.BlockerWorkItemId));
    }

    [Fact]
    public async Task AddDependency_MultipleBlockersBlockOneItem()
    {
        using var db = CreateDb();
        var svc = CreateDepService(db);
        var (_, _, team, user, _, _) = await SeedBasic(db);

        var bl1 = MakeWorkItem(team.Id, user.Id, "Bl1");
        var bl2 = MakeWorkItem(team.Id, user.Id, "Bl2");
        var blocked = MakeWorkItem(team.Id, user.Id, "Blocked");
        db.WorkItems.AddRange(bl1, bl2, blocked);
        await db.SaveChangesAsync();

        await svc.AddDependencyAsync(blocked.Id, bl1.Id, user.Id);
        await svc.AddDependencyAsync(blocked.Id, bl2.Id, user.Id);

        var deps = await db.WorkItemDependencies.Where(d => d.BlockedWorkItemId == blocked.Id).ToListAsync();
        Assert.Equal(2, deps.Count);
    }

    [Fact]
    public async Task AddDependency_DuplicateThrows()
    {
        using var db = CreateDb();
        var svc = CreateDepService(db);
        var (_, _, team, user, _, _) = await SeedBasic(db);

        var blocker = MakeWorkItem(team.Id, user.Id, "Blocker");
        var blocked = MakeWorkItem(team.Id, user.Id, "Blocked");
        db.WorkItems.AddRange(blocker, blocked);
        await db.SaveChangesAsync();

        await svc.AddDependencyAsync(blocked.Id, blocker.Id, user.Id);

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => svc.AddDependencyAsync(blocked.Id, blocker.Id, user.Id));
    }

    [Fact]
    public async Task AddDependency_SelfBlockThrows()
    {
        using var db = CreateDb();
        var svc = CreateDepService(db);
        var (_, _, team, user, _, _) = await SeedBasic(db);

        var item = MakeWorkItem(team.Id, user.Id, "Item");
        db.WorkItems.Add(item);
        await db.SaveChangesAsync();

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => svc.AddDependencyAsync(item.Id, item.Id, user.Id));
    }

    // ── Cycle detection ────────────────────────────────────────

    [Fact]
    public async Task AddDependency_DirectCycleThrows()
    {
        using var db = CreateDb();
        var svc = CreateDepService(db);
        var (_, _, team, user, _, _) = await SeedBasic(db);

        var a = MakeWorkItem(team.Id, user.Id, "A");
        var b = MakeWorkItem(team.Id, user.Id, "B");
        db.WorkItems.AddRange(a, b);
        await db.SaveChangesAsync();

        // A blocks B
        await svc.AddDependencyAsync(b.Id, a.Id, user.Id);

        // B blocks A → cycle
        await Assert.ThrowsAsync<InvalidOperationException>(
            () => svc.AddDependencyAsync(a.Id, b.Id, user.Id));
    }

    [Fact]
    public async Task AddDependency_IndirectCycleThrows()
    {
        using var db = CreateDb();
        var svc = CreateDepService(db);
        var (_, _, team, user, _, _) = await SeedBasic(db);

        var a = MakeWorkItem(team.Id, user.Id, "A");
        var b = MakeWorkItem(team.Id, user.Id, "B");
        var c = MakeWorkItem(team.Id, user.Id, "C");
        db.WorkItems.AddRange(a, b, c);
        await db.SaveChangesAsync();

        // A blocks B, B blocks C
        await svc.AddDependencyAsync(b.Id, a.Id, user.Id);
        await svc.AddDependencyAsync(c.Id, b.Id, user.Id);

        // C blocks A → indirect cycle A→B→C→A
        await Assert.ThrowsAsync<InvalidOperationException>(
            () => svc.AddDependencyAsync(a.Id, c.Id, user.Id));
    }

    // ── Cross-team dependency ──────────────────────────────────

    [Fact]
    public async Task AddDependency_CrossTeamWorks()
    {
        using var db = CreateDb();
        var svc = CreateDepService(db);
        var (org, product, team1, user, orgMember, _) = await SeedBasic(db);

        var team2 = new Team { ProductId = product.Id, Name = "Team2", CreatedBy = user.Id, UpdatedBy = user.Id };
        db.Teams.Add(team2);
        await db.SaveChangesAsync();

        var backendTask = MakeWorkItem(team1.Id, user.Id, "Backend Task");
        var frontendTask = MakeWorkItem(team2.Id, user.Id, "Frontend Task");
        db.WorkItems.AddRange(backendTask, frontendTask);
        await db.SaveChangesAsync();

        var dep = await svc.AddDependencyAsync(frontendTask.Id, backendTask.Id, user.Id);

        Assert.Equal(backendTask.Id, dep.WorkItemId);
    }

    // ── RemoveDependency ───────────────────────────────────────

    [Fact]
    public async Task RemoveDependency_RemovesOneWithoutAffectingOthers()
    {
        using var db = CreateDb();
        var svc = CreateDepService(db);
        var (_, _, team, user, orgMember, _) = await SeedBasic(db);

        var bl1 = MakeWorkItem(team.Id, user.Id, "Bl1");
        var bl2 = MakeWorkItem(team.Id, user.Id, "Bl2");
        var blocked = MakeWorkItem(team.Id, user.Id, "Blocked");
        db.WorkItems.AddRange(bl1, bl2, blocked);
        await db.SaveChangesAsync();

        var dep1 = await svc.AddDependencyAsync(blocked.Id, bl1.Id, user.Id);
        await svc.AddDependencyAsync(blocked.Id, bl2.Id, user.Id);

        await svc.RemoveDependencyAsync(dep1.DependencyId, user.Id);

        var remaining = await db.WorkItemDependencies.Where(d => d.BlockedWorkItemId == blocked.Id).ToListAsync();
        Assert.Single(remaining);
        Assert.Equal(bl2.Id, remaining[0].BlockerWorkItemId);
    }

    // ── GetUnfinishedBlockers ──────────────────────────────────

    [Fact]
    public async Task GetUnfinishedBlockers_ReturnsOnlyUnfinished()
    {
        using var db = CreateDb();
        var svc = CreateDepService(db);
        var (_, _, team, user, _, _) = await SeedBasic(db);

        var done = MakeWorkItem(team.Id, user.Id, "Done", WorkItemStatus.Done);
        var inProgress = MakeWorkItem(team.Id, user.Id, "InProg", WorkItemStatus.InProgress);
        var blocked = MakeWorkItem(team.Id, user.Id, "Blocked");
        db.WorkItems.AddRange(done, inProgress, blocked);
        await db.SaveChangesAsync();

        await svc.AddDependencyAsync(blocked.Id, done.Id, user.Id);
        await svc.AddDependencyAsync(blocked.Id, inProgress.Id, user.Id);

        var unfinished = await svc.GetUnfinishedBlockersAsync(blocked.Id);

        Assert.Single(unfinished);
        Assert.Equal("InProg", unfinished[0].Title);
    }

    // ── Status transition block ────────────────────────────────

    [Fact]
    public async Task UpdateWorkItem_ThrowsWhenMovingToInProgressWithUnfinishedBlockers()
    {
        using var db = CreateDb();
        var depSvc = CreateDepService(db);
        var svc = CreateWorkItemService(db);
        var (_, _, team, user, orgMember, teamMember) = await SeedBasic(db);

        var blocker = MakeWorkItem(team.Id, user.Id, "Blocker", WorkItemStatus.Todo);
        var blocked = MakeWorkItem(team.Id, user.Id, "Blocked", WorkItemStatus.Todo);
        db.WorkItems.AddRange(blocker, blocked);
        await db.SaveChangesAsync();

        await depSvc.AddDependencyAsync(blocked.Id, blocker.Id, user.Id);

        var dto = new iterimApi.DTOs.WorkItems.UpdateWorkItemDto
        {
            Title = "Blocked",
            Status = WorkItemStatus.InProgress,
            Priority = WorkItemPriority.Medium
        };

        await Assert.ThrowsAsync<BlockedByDependenciesException>(
            () => svc.UpdateWorkItemAsync(blocked.Id, dto, user.Id));
    }

    [Fact]
    public async Task UpdateWorkItem_AllowsInProgressWhenAllBlockersDone()
    {
        using var db = CreateDb();
        var depSvc = CreateDepService(db);
        var svc = CreateWorkItemService(db);
        var (_, _, team, user, orgMember, teamMember) = await SeedBasic(db);

        var blocker = MakeWorkItem(team.Id, user.Id, "Blocker", WorkItemStatus.Done);
        var blocked = MakeWorkItem(team.Id, user.Id, "Blocked", WorkItemStatus.Todo);
        db.WorkItems.AddRange(blocker, blocked);
        await db.SaveChangesAsync();

        // Need UpdatedByUser navigation to work
        await db.Entry(blocked).Reference(wi => wi.CreatedByUser).LoadAsync();

        await depSvc.AddDependencyAsync(blocked.Id, blocker.Id, user.Id);

        var dto = new iterimApi.DTOs.WorkItems.UpdateWorkItemDto
        {
            Title = "Blocked",
            Status = WorkItemStatus.InProgress,
            Priority = WorkItemPriority.Medium
        };

        var result = await svc.UpdateWorkItemAsync(blocked.Id, dto, user.Id);

        Assert.NotNull(result);
        Assert.Equal("InProgress", result.Status);
    }

    [Fact]
    public async Task UpdateWorkItem_OneOfThreeBlockersNotDone_ThrowsWithAllUnfinished()
    {
        using var db = CreateDb();
        var depSvc = CreateDepService(db);
        var svc = CreateWorkItemService(db);
        var (_, _, team, user, orgMember, teamMember) = await SeedBasic(db);

        var bl1 = MakeWorkItem(team.Id, user.Id, "Bl1", WorkItemStatus.Done);
        var bl2 = MakeWorkItem(team.Id, user.Id, "Bl2", WorkItemStatus.Done);
        var bl3 = MakeWorkItem(team.Id, user.Id, "Bl3", WorkItemStatus.Todo);
        var blocked = MakeWorkItem(team.Id, user.Id, "Blocked", WorkItemStatus.Todo);
        db.WorkItems.AddRange(bl1, bl2, bl3, blocked);
        await db.SaveChangesAsync();

        await depSvc.AddDependencyAsync(blocked.Id, bl1.Id, user.Id);
        await depSvc.AddDependencyAsync(blocked.Id, bl2.Id, user.Id);
        await depSvc.AddDependencyAsync(blocked.Id, bl3.Id, user.Id);

        var dto = new iterimApi.DTOs.WorkItems.UpdateWorkItemDto
        {
            Title = "Blocked",
            Status = WorkItemStatus.InProgress,
            Priority = WorkItemPriority.Medium
        };

        var ex = await Assert.ThrowsAsync<BlockedByDependenciesException>(
            () => svc.UpdateWorkItemAsync(blocked.Id, dto, user.Id));

        Assert.Single(ex.Blockers);
        Assert.Equal("Bl3", ex.Blockers[0].Title);
    }

    // ── GetDependencies ────────────────────────────────────────

    [Fact]
    public async Task GetDependencies_ReturnsBothDirections()
    {
        using var db = CreateDb();
        var svc = CreateDepService(db);
        var (_, _, team, user, _, _) = await SeedBasic(db);

        var a = MakeWorkItem(team.Id, user.Id, "A");
        var b = MakeWorkItem(team.Id, user.Id, "B");
        var c = MakeWorkItem(team.Id, user.Id, "C");
        db.WorkItems.AddRange(a, b, c);
        await db.SaveChangesAsync();

        // A blocks B (B is blocked by A), B blocks C
        await svc.AddDependencyAsync(b.Id, a.Id, user.Id);
        await svc.AddDependencyAsync(c.Id, b.Id, user.Id);

        var deps = await svc.GetDependenciesAsync(b.Id, user.Id);

        Assert.Single(deps.Blocks);
        Assert.Equal("C", deps.Blocks[0].Title);
        Assert.Single(deps.BlockedBy);
        Assert.Equal("A", deps.BlockedBy[0].Title);
    }
}
