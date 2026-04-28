using System.Security.Claims;
using iterimApi.Controllers;
using iterimApi.Data;
using iterimApi.DTOs.WorkItems;
using iterimApi.Models.Entities;
using iterimApi.Models.Enums;
using iterimApi.Services.Implementations;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace iterimApi.Tests;

public class WorkItemTransferTests
{
    private static AppDbContext CreateDb()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new AppDbContext(options);
    }

    private static WorkItemService CreateService(AppDbContext db)
    {
        return new WorkItemService(db, new WorkItemDependencyService(db));
    }

    private static WorkItemsController CreateController(AppDbContext db, int userId)
    {
        var controller = new WorkItemsController(CreateService(db))
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(new ClaimsIdentity(
                    [
                        new Claim(ClaimTypes.NameIdentifier, userId.ToString())
                    ], "TestAuth"))
                }
            }
        };

        return controller;
    }

    private static async Task<(User leader, User member, User targetUser, Organization org, Product sourceProduct, Product targetProduct, Team sourceTeam, Team targetTeam, OrganizationMember leaderOrgMember, OrganizationMember memberOrgMember, TeamMember leaderTeamMember, TeamMember memberTeamMember, TeamMember targetTeamMember)> SeedAsync(AppDbContext db)
    {
        var leader = new User { Name = "Leader", Email = "leader@test.com", Role = UserRole.User };
        var member = new User { Name = "Member", Email = "member@test.com", Role = UserRole.User };
        var targetUser = new User { Name = "Target", Email = "target@test.com", Role = UserRole.User };
        db.Users.AddRange(leader, member, targetUser);
        await db.SaveChangesAsync();

        var org = new Organization { Name = "Org", Slug = "org", CreatedBy = leader.Id, UpdatedBy = leader.Id };
        db.Organizations.Add(org);
        await db.SaveChangesAsync();

        var leaderOrgMember = new OrganizationMember
        {
            OrganizationId = org.Id,
            UserId = leader.Id,
            Email = leader.Email,
            Role = OrgMemberRole.Admin,
            Status = OrgMemberStatus.Active
        };

        var memberOrgMember = new OrganizationMember
        {
            OrganizationId = org.Id,
            UserId = member.Id,
            Email = member.Email,
            Role = OrgMemberRole.Member,
            Status = OrgMemberStatus.Active
        };

        var targetOrgMember = new OrganizationMember
        {
            OrganizationId = org.Id,
            UserId = targetUser.Id,
            Email = targetUser.Email,
            Role = OrgMemberRole.Admin,
            Status = OrgMemberStatus.Active
        };

        db.OrganizationMembers.AddRange(leaderOrgMember, memberOrgMember, targetOrgMember);
        await db.SaveChangesAsync();

        var sourceProduct = new Product { OrganizationId = org.Id, Name = "Source", CreatedBy = leader.Id, UpdatedBy = leader.Id };
        var targetProduct = new Product { OrganizationId = org.Id, Name = "Target", CreatedBy = leader.Id, UpdatedBy = leader.Id };
        db.Products.AddRange(sourceProduct, targetProduct);
        await db.SaveChangesAsync();

        var sourceTeam = new Team { ProductId = sourceProduct.Id, Name = "Source Team", CreatedBy = leader.Id, UpdatedBy = leader.Id };
        var targetTeam = new Team { ProductId = targetProduct.Id, Name = "Target Team", CreatedBy = targetUser.Id, UpdatedBy = targetUser.Id };
        db.Teams.AddRange(sourceTeam, targetTeam);
        await db.SaveChangesAsync();

        var leaderTeamMember = new TeamMember
        {
            TeamId = sourceTeam.Id,
            OrgMemberId = leaderOrgMember.Id,
            Role = TeamMemberRole.Member,
            CreatedBy = leader.Id,
            UpdatedBy = leader.Id
        };

        var memberTeamMember = new TeamMember
        {
            TeamId = sourceTeam.Id,
            OrgMemberId = memberOrgMember.Id,
            Role = TeamMemberRole.Member,
            CreatedBy = leader.Id,
            UpdatedBy = leader.Id
        };

        var targetTeamMember = new TeamMember
        {
            TeamId = targetTeam.Id,
            OrgMemberId = targetOrgMember.Id,
            Role = TeamMemberRole.Admin,
            CreatedBy = targetUser.Id,
            UpdatedBy = targetUser.Id
        };

        db.TeamMembers.AddRange(leaderTeamMember, memberTeamMember, targetTeamMember);
        await db.SaveChangesAsync();

        return (leader, member, targetUser, org, sourceProduct, targetProduct, sourceTeam, targetTeam, leaderOrgMember, memberOrgMember, leaderTeamMember, memberTeamMember, targetTeamMember);
    }

    private static WorkItem MakeWorkItem(int teamId, int createdBy, int? assignedTo = null, int? iterationId = null, string title = "Task")
        => new()
        {
            TeamId = teamId,
            Title = title,
            Status = WorkItemStatus.Todo,
            Type = WorkItemType.Task,
            Priority = WorkItemPriority.Medium,
            CreatedBy = createdBy,
            UpdatedBy = createdBy,
            AssignedTo = assignedTo,
            IterationId = iterationId,
            Position = 3
        };

    [Fact]
    public async Task TransferWorkItem_AsLeader_SucceedsAndClearsIterationAndAssignee()
    {
        using var db = CreateDb();
        var service = CreateService(db);
        var (leader, _, _, _, _, _, sourceTeam, targetTeam, leaderOrgMember, _, leaderTeamMember, _, _) = await SeedAsync(db);

        var iteration = new Iteration
        {
            TeamId = sourceTeam.Id,
            Name = "Sprint 1",
            StartDate = DateOnly.FromDateTime(DateTime.UtcNow),
            EndDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(14)),
            CreatedBy = leader.Id,
            UpdatedBy = leader.Id
        };
        db.Iterations.Add(iteration);
        await db.SaveChangesAsync();

        var item = MakeWorkItem(sourceTeam.Id, leader.Id, leaderTeamMember.Id, iteration.Id, "Transfer me");
        db.WorkItems.Add(item);
        await db.SaveChangesAsync();

        var result = await service.TransferWorkItemAsync(item.Id, targetTeam.Id, leader.Id);

        Assert.NotNull(result);
        Assert.Equal(targetTeam.Id, result!.TeamId);
        Assert.Null(result.AssignedTo);
        Assert.Null(result.IterationId);

        var transferred = await db.WorkItems.SingleAsync(wi => wi.Id == item.Id);
        Assert.Equal(targetTeam.Id, transferred.TeamId);
        Assert.Null(transferred.AssignedTo);
        Assert.Null(transferred.IterationId);

        var history = await db.WorkItemHistories.Where(h => h.WorkItemId == item.Id).ToListAsync();
        Assert.Contains(history, h => h.FieldName == "TeamId" && h.OldValue == sourceTeam.Id.ToString() && h.NewValue == targetTeam.Id.ToString());
        Assert.Contains(history, h => h.FieldName == "IterationId" && h.OldValue == iteration.Id.ToString() && h.NewValue == null);
        Assert.Contains(history, h => h.FieldName == "AssignedTo" && h.OldValue == leaderTeamMember.Id.ToString() && h.NewValue == null);
    }

    [Fact]
    public async Task TransferWorkItem_AsMember_ReturnsForbidden()
    {
        using var db = CreateDb();
        var (leader, member, _, _, _, _, sourceTeam, targetTeam, _, _, _, memberTeamMember, _) = await SeedAsync(db);

        var item = MakeWorkItem(sourceTeam.Id, leader.Id, memberTeamMember.Id, null, "Transfer me");
        db.WorkItems.Add(item);
        await db.SaveChangesAsync();

        controller = CreateController(db, member.Id);

        var result = await controller.TransferWorkItem(item.Id, new TransferWorkItemDto { TargetTeamId = targetTeam.Id });

        var status = Assert.IsType<ObjectResult>(result);
        Assert.Equal(403, status.StatusCode);
        Assert.NotNull(status.Value);
    }

    [Fact]
    public async Task TransferWorkItem_PreservesDependencies()
    {
        using var db = CreateDb();
        var service = CreateService(db);
        var (leader, _, _, _, _, _, sourceTeam, targetTeam, _, _, _, _, _) = await SeedAsync(db);

        var blocker = MakeWorkItem(sourceTeam.Id, leader.Id, null, null, "Blocker");
        var blocked = MakeWorkItem(sourceTeam.Id, leader.Id, null, null, "Blocked");
        db.WorkItems.AddRange(blocker, blocked);
        await db.SaveChangesAsync();

        db.WorkItemDependencies.Add(new WorkItemDependency
        {
            BlockerWorkItemId = blocker.Id,
            BlockedWorkItemId = blocked.Id,
            CreatedBy = leader.Id
        });
        await db.SaveChangesAsync();

        await service.TransferWorkItemAsync(blocked.Id, targetTeam.Id, leader.Id);

        var dependencies = await db.WorkItemDependencies.Where(d => d.BlockedWorkItemId == blocked.Id || d.BlockerWorkItemId == blocked.Id).ToListAsync();
        Assert.Single(dependencies);
        Assert.Equal(blocker.Id, dependencies[0].BlockerWorkItemId);
        Assert.Equal(blocked.Id, dependencies[0].BlockedWorkItemId);
    }

    [Fact]
    public async Task TransferWorkItem_ToMissingTeam_Throws()
    {
        using var db = CreateDb();
        var service = CreateService(db);
        var (leader, _, _, _, _, _, sourceTeam, _, _, _, _, _, _) = await SeedAsync(db);

        var item = MakeWorkItem(sourceTeam.Id, leader.Id);
        db.WorkItems.Add(item);
        await db.SaveChangesAsync();

        await Assert.ThrowsAsync<KeyNotFoundException>(
            () => service.TransferWorkItemAsync(item.Id, 9999, leader.Id));
    }
}