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
using Microsoft.Extensions.Logging.Abstractions;

namespace iterimApi.Tests;

public class WorkItemBulkImportTests
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
        var notifications = new NotificationService(db, NullLogger<NotificationService>.Instance);
        return new WorkItemService(db, new WorkItemDependencyService(db), notifications);
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

    private static async Task<(User admin, User member, Team team)> SeedAsync(AppDbContext db)
    {
        var admin = new User { Name = "Admin", Email = "admin@test.com", Role = UserRole.User };
        var member = new User { Name = "Member", Email = "member@test.com", Role = UserRole.User };
        db.Users.AddRange(admin, member);
        await db.SaveChangesAsync();

        var org = new Organization { Name = "Org", Slug = "org", CreatedBy = admin.Id, UpdatedBy = admin.Id };
        db.Organizations.Add(org);
        await db.SaveChangesAsync();

        var adminOrgMember = new OrganizationMember
        {
            OrganizationId = org.Id, UserId = admin.Id,
            Role = OrgMemberRole.Admin, Status = OrgMemberStatus.Active
        };
        var memberOrgMember = new OrganizationMember
        {
            OrganizationId = org.Id, UserId = member.Id,
            Role = OrgMemberRole.Member, Status = OrgMemberStatus.Active
        };
        db.OrganizationMembers.AddRange(adminOrgMember, memberOrgMember);
        await db.SaveChangesAsync();

        var product = new Product
        {
            OrganizationId = org.Id, Name = "Prod",
            CreatedBy = admin.Id, UpdatedBy = admin.Id
        };
        db.Products.Add(product);
        await db.SaveChangesAsync();

        var team = new Team
        {
            ProductId = product.Id, Name = "Team",
            CreatedBy = admin.Id, UpdatedBy = admin.Id
        };
        db.Teams.Add(team);
        await db.SaveChangesAsync();

        var adminTeamMember = new TeamMember
        {
            TeamId = team.Id, OrgMemberId = adminOrgMember.Id,
            Role = TeamMemberRole.Admin,
            CreatedBy = admin.Id, UpdatedBy = admin.Id
        };
        var regularTeamMember = new TeamMember
        {
            TeamId = team.Id, OrgMemberId = memberOrgMember.Id,
            Role = TeamMemberRole.Member,
            CreatedBy = admin.Id, UpdatedBy = admin.Id
        };
        db.TeamMembers.AddRange(adminTeamMember, regularTeamMember);
        await db.SaveChangesAsync();

        return (admin, member, team);
    }

    [Fact]
    public async Task BulkImport_AdminCanImportItems_ReturnsCorrectCount()
    {
        var db = CreateDb();
        var (admin, _, team) = await SeedAsync(db);
        var controller = CreateController(db, admin.Id);

        var dto = new BulkCreateWorkItemsDto
        {
            Items =
            [
                new ImportWorkItemDto { Title = "Story 1", Type = WorkItemType.Story, Priority = WorkItemPriority.High, Status = WorkItemStatus.Backlog },
                new ImportWorkItemDto { Title = "Bug 1", Type = WorkItemType.Bug, Priority = WorkItemPriority.Medium, Status = WorkItemStatus.Todo },
            ]
        };

        var result = await controller.BulkCreateWorkItems(team.Id, dto);

        var ok = Assert.IsType<OkObjectResult>(result);
        Assert.NotNull(ok.Value);

        var count = await db.WorkItems.CountAsync(wi => wi.TeamId == team.Id);
        Assert.Equal(2, count);
    }

    [Fact]
    public async Task BulkImport_NonAdmin_Returns403()
    {
        var db = CreateDb();
        var (_, member, team) = await SeedAsync(db);
        var controller = CreateController(db, member.Id);

        var dto = new BulkCreateWorkItemsDto
        {
            Items = [new ImportWorkItemDto { Title = "Item", Type = WorkItemType.Task }]
        };

        var result = await controller.BulkCreateWorkItems(team.Id, dto);

        Assert.IsType<ObjectResult>(result);
        Assert.Equal(403, ((ObjectResult)result).StatusCode);
    }

    [Fact]
    public async Task BulkImport_WithIteration_AssignsToIteration()
    {
        var db = CreateDb();
        var (admin, _, team) = await SeedAsync(db);

        var iteration = new Iteration
        {
            TeamId = team.Id, Name = "Sprint 1",
            StartDate = DateOnly.FromDateTime(DateTime.UtcNow),
            EndDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(14)),
            Status = IterationStatus.Planning,
            CreatedBy = admin.Id, UpdatedBy = admin.Id
        };
        db.Iterations.Add(iteration);
        await db.SaveChangesAsync();

        var controller = CreateController(db, admin.Id);
        var dto = new BulkCreateWorkItemsDto
        {
            Items = [new ImportWorkItemDto { Title = "Sprint item", Type = WorkItemType.Task, IterationId = iteration.Id }]
        };

        var result = await controller.BulkCreateWorkItems(team.Id, dto);

        Assert.IsType<OkObjectResult>(result);
        var wi = await db.WorkItems.FirstAsync(wi => wi.TeamId == team.Id);
        Assert.Equal(iteration.Id, wi.IterationId);
    }

    [Fact]
    public async Task BulkImport_InvalidIterationId_Returns400()
    {
        var db = CreateDb();
        var (admin, _, team) = await SeedAsync(db);
        var controller = CreateController(db, admin.Id);

        var dto = new BulkCreateWorkItemsDto
        {
            Items = [new ImportWorkItemDto { Title = "Bad iter", Type = WorkItemType.Task, IterationId = 99999 }]
        };

        var result = await controller.BulkCreateWorkItems(team.Id, dto);

        var bad = Assert.IsType<BadRequestObjectResult>(result);
        Assert.NotNull(bad.Value);
    }
}
