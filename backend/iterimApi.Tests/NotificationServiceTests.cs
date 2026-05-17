using System.Text.Json;
using iterimApi.Data;
using iterimApi.Models.Entities;
using iterimApi.Models.Enums;
using iterimApi.Services.Implementations;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace iterimApi.Tests;

public class NotificationServiceTests
{
    // ── Fixtures ──────────────────────────────────────────────

    private static AppDbContext CreateDb()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }

    private static NotificationService CreateService(AppDbContext db) =>
        new(db, NullLogger<NotificationService>.Instance);

    private static async Task<int> SeedUserAsync(AppDbContext db, string email = "user@test.com")
    {
        var user = new User { Name = "User", Email = email, Role = UserRole.User };
        db.Users.Add(user);
        await db.SaveChangesAsync();
        return user.Id;
    }

    // ── Tests ─────────────────────────────────────────────────

    [Fact]
    public async Task CreateAsync_PersistsKeysParamsAndEnglishFallback()
    {
        using var db = CreateDb();
        var svc = CreateService(db);
        var userId = await SeedUserAsync(db);

        await svc.CreateAsync(
            userId,
            NotificationType.WorkItemAssigned,
            "notifications.workItemAssigned.title",
            "notifications.workItemAssigned.message",
            new Dictionary<string, string> { ["workItemTitle"] = "Fix login bug" },
            "/workitems/42");

        var stored = await db.Notifications.SingleAsync();
        Assert.Equal(userId, stored.UserId);
        Assert.Equal("notifications.workItemAssigned.title", stored.TitleKey);
        Assert.Equal("notifications.workItemAssigned.message", stored.MessageKey);
        Assert.NotNull(stored.MessageParams);

        var parameters = JsonSerializer.Deserialize<Dictionary<string, string>>(stored.MessageParams!);
        Assert.NotNull(parameters);
        Assert.Equal("Fix login bug", parameters!["workItemTitle"]);

        // English fallback gets rendered immediately
        Assert.Equal("Work item assigned", stored.Title);
        Assert.Equal("You've been assigned to work item: \"Fix login bug\".", stored.Message);
        Assert.Equal("/workitems/42", stored.RelatedUrl);
    }

    [Fact]
    public async Task CreateAsync_NoParams_StoresNullMessageParams()
    {
        using var db = CreateDb();
        var svc = CreateService(db);
        var userId = await SeedUserAsync(db);

        await svc.CreateAsync(
            userId,
            NotificationType.PasswordReset,
            "notifications.passwordReset.title",
            "notifications.passwordReset.message");

        var stored = await db.Notifications.SingleAsync();
        Assert.Null(stored.MessageParams);
        Assert.Equal("Password reset", stored.Title);
    }

    [Fact]
    public async Task CreateAsync_UnknownKey_FallsBackToKeyAsTitle()
    {
        using var db = CreateDb();
        var svc = CreateService(db);
        var userId = await SeedUserAsync(db);

        await svc.CreateAsync(
            userId,
            NotificationType.WorkItemAssigned,
            "totally.unknown.key",
            "another.unknown.key");

        var stored = await db.Notifications.SingleAsync();
        Assert.Equal("totally.unknown.key", stored.Title);
        Assert.Equal("another.unknown.key", stored.Message);
    }

    [Fact]
    public async Task CreateAsync_RespectsMasterDisable()
    {
        using var db = CreateDb();
        var svc = CreateService(db);
        var user = new User { Name = "U", Email = "x@test.com", Role = UserRole.User, NotificationsEnabled = false };
        db.Users.Add(user);
        await db.SaveChangesAsync();

        await svc.CreateAsync(
            user.Id,
            NotificationType.WorkItemAssigned,
            "notifications.workItemAssigned.title",
            "notifications.workItemAssigned.message");

        Assert.Equal(0, await db.Notifications.CountAsync());
    }

    [Fact]
    public async Task CreateAsync_RespectsPerTypeDisable()
    {
        using var db = CreateDb();
        var svc = CreateService(db);
        var user = new User { Name = "U", Email = "x@test.com", Role = UserRole.User, NotifyOnWorkItemAssigned = false };
        db.Users.Add(user);
        await db.SaveChangesAsync();

        await svc.CreateAsync(
            user.Id,
            NotificationType.WorkItemAssigned,
            "notifications.workItemAssigned.title",
            "notifications.workItemAssigned.message");

        Assert.Equal(0, await db.Notifications.CountAsync());
    }

    [Fact]
    public async Task CreateAsync_PasswordReset_BypassesPreferences()
    {
        using var db = CreateDb();
        var svc = CreateService(db);
        var user = new User
        {
            Name = "U",
            Email = "x@test.com",
            Role = UserRole.User,
            NotificationsEnabled = false  // even the master switch off
        };
        db.Users.Add(user);
        await db.SaveChangesAsync();

        await svc.CreateAsync(
            user.Id,
            NotificationType.PasswordReset,
            "notifications.passwordReset.title",
            "notifications.passwordReset.message");

        Assert.Equal(1, await db.Notifications.CountAsync());
    }

    [Fact]
    public async Task GetAsync_ReturnsKeysAndDeserializedParams()
    {
        using var db = CreateDb();
        var svc = CreateService(db);
        var userId = await SeedUserAsync(db);

        await svc.CreateAsync(
            userId,
            NotificationType.AddedToTeam,
            "notifications.addedToTeam.title",
            "notifications.addedToTeam.message",
            new Dictionary<string, string> { ["teamName"] = "Backend" });

        var result = await svc.GetAsync(userId, 1, 20);

        var dto = Assert.Single(result.Items);
        Assert.Equal("notifications.addedToTeam.title", dto.TitleKey);
        Assert.Equal("notifications.addedToTeam.message", dto.MessageKey);
        Assert.NotNull(dto.MessageParams);
        Assert.Equal("Backend", dto.MessageParams!["teamName"]);
    }

    [Fact]
    public async Task MarkAsReadAsync_ReturnsFalseForOtherUsersNotification()
    {
        using var db = CreateDb();
        var svc = CreateService(db);
        var owner = await SeedUserAsync(db, "owner@test.com");
        var attacker = await SeedUserAsync(db, "attacker@test.com");

        await svc.CreateAsync(owner, NotificationType.WorkItemAssigned,
            "notifications.workItemAssigned.title",
            "notifications.workItemAssigned.message");

        var n = await db.Notifications.SingleAsync();
        var ok = await svc.MarkAsReadAsync(n.Id, attacker);

        Assert.False(ok);
        Assert.False((await db.Notifications.FindAsync(n.Id))!.IsRead);
    }

    [Fact(Skip = "ExecuteDeleteAsync is not supported by EF Core's InMemory provider. " +
                 "Verified manually against MySQL.")]
    public async Task DeleteOlderThanAsync_RemovesOnlyOldOnes()
    {
        using var db = CreateDb();
        var svc = CreateService(db);
        var userId = await SeedUserAsync(db);

        db.Notifications.AddRange(
            new Notification
            {
                UserId = userId,
                Type = NotificationType.WorkItemAssigned,
                TitleKey = "k",
                MessageKey = "k",
                Title = "old",
                Message = "",
                CreatedAt = DateTime.UtcNow.AddDays(-31)
            },
            new Notification
            {
                UserId = userId,
                Type = NotificationType.WorkItemAssigned,
                TitleKey = "k",
                MessageKey = "k",
                Title = "fresh",
                Message = "",
                CreatedAt = DateTime.UtcNow.AddDays(-5)
            });
        await db.SaveChangesAsync();

        var deleted = await svc.DeleteOlderThanAsync(30);

        Assert.Equal(1, deleted);
        var remaining = await db.Notifications.AsNoTracking().SingleAsync();
        Assert.Equal("fresh", remaining.Title);
    }

    [Fact]
    public async Task BlockerResolved_NotifiesAssigneeOfUnblockedItem()
    {
        using var db = CreateDb();

        // Seed minimal graph: 2 users, 1 org, 1 product, 1 team, 2 work items, 1 dependency.
        var actor = new User { Name = "Actor", Email = "a@t.com", Role = UserRole.User };
        var assignee = new User { Name = "Assignee", Email = "b@t.com", Role = UserRole.User };
        db.Users.AddRange(actor, assignee);
        await db.SaveChangesAsync();

        var org = new Organization { Name = "O", Slug = "o", CreatedBy = actor.Id, UpdatedBy = actor.Id };
        db.Organizations.Add(org);
        await db.SaveChangesAsync();

        var product = new Product
        {
            OrganizationId = org.Id,
            Name = "P",
            Description = "",
            CreatedBy = actor.Id,
            UpdatedBy = actor.Id,
        };
        db.Products.Add(product);
        await db.SaveChangesAsync();

        var team = new Team
        {
            ProductId = product.Id,
            Name = "T",
            Description = "",
            CreatedBy = actor.Id,
            UpdatedBy = actor.Id,
        };
        db.Teams.Add(team);
        await db.SaveChangesAsync();

        var assigneeOrgMember = new OrganizationMember
        {
            OrganizationId = org.Id,
            UserId = assignee.Id,
            Email = assignee.Email,
            Role = OrgMemberRole.Member,
            Status = OrgMemberStatus.Active,
        };
        db.OrganizationMembers.Add(assigneeOrgMember);
        await db.SaveChangesAsync();

        var assigneeTeamMember = new TeamMember
        {
            TeamId = team.Id,
            OrgMemberId = assigneeOrgMember.Id,
            Role = TeamMemberRole.Member,
            CreatedBy = actor.Id,
            UpdatedBy = actor.Id,
        };
        db.TeamMembers.Add(assigneeTeamMember);
        await db.SaveChangesAsync();

        var blocker = new WorkItem
        {
            TeamId = team.Id,
            Title = "Blocker",
            Description = "",
            Status = WorkItemStatus.InProgress,
            Type = WorkItemType.Task,
            Priority = WorkItemPriority.Medium,
            CreatedBy = actor.Id,
            UpdatedBy = actor.Id,
        };
        var blocked = new WorkItem
        {
            TeamId = team.Id,
            Title = "Blocked",
            Description = "",
            Status = WorkItemStatus.Todo,
            Type = WorkItemType.Task,
            Priority = WorkItemPriority.Medium,
            AssignedTo = assigneeTeamMember.Id,
            CreatedBy = actor.Id,
            UpdatedBy = actor.Id,
        };
        db.WorkItems.AddRange(blocker, blocked);
        await db.SaveChangesAsync();

        db.WorkItemDependencies.Add(new WorkItemDependency
        {
            BlockerWorkItemId = blocker.Id,
            BlockedWorkItemId = blocked.Id,
            CreatedBy = assigneeOrgMember.Id,
        });
        await db.SaveChangesAsync();

        // Act: simulate the Done transition by calling the WorkItemService update path indirectly.
        // Easier: invoke the notification service directly to verify the query shape compiles.
        var notifications = new NotificationService(db, NullLogger<NotificationService>.Instance);
        var workItemService = new WorkItemService(db, new WorkItemDependencyService(db), notifications);

        await workItemService.UpdateWorkItemAsync(blocker.Id, new DTOs.WorkItems.UpdateWorkItemDto
        {
            Title = blocker.Title,
            Description = blocker.Description,
            Points = null,
            Type = blocker.Type,
            Priority = blocker.Priority,
            Status = WorkItemStatus.Done,
            AssignedTo = null,
            IterationId = null,
        }, actor.Id);

        // Assert: assignee got a BlockerResolved notification.
        var notif = await db.Notifications.SingleOrDefaultAsync(n =>
            n.UserId == assignee.Id && n.Type == NotificationType.BlockerResolved);
        Assert.NotNull(notif);
        Assert.Contains("Blocked", notif!.Title);
    }
}