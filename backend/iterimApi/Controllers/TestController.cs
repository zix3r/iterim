using iterimApi.Data;
using iterimApi.Models.Entities;
using iterimApi.Models.Enums;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace iterimApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TestController : ControllerBase
{
    private readonly AppDbContext _db;

    public TestController(AppDbContext db)
    {
        _db = db;
    }

    [HttpPost("seed")]
    public async Task<IActionResult> Seed()
    {
        // 1. Create Users
        var users = new List<User>
        {
            new User { Email = "test@iterim.dev", Name = "Test User", PasswordHash = "not-a-real-hash", Role = UserRole.Admin },
            new User { Email = "john@iterim.dev", Name = "John Developer", PasswordHash = "not-a-real-hash", Role = UserRole.User },
            new User { Email = "jane@iterim.dev", Name = "Jane Designer", PasswordHash = "not-a-real-hash", Role = UserRole.User },
            new User { Email = "bob@iterim.dev", Name = "Bob Tester", PasswordHash = "not-a-real-hash", Role = UserRole.User }
        };
        _db.Users.AddRange(users);
        await _db.SaveChangesAsync();

        var adminUser = users[0];
        var john = users[1];
        var jane = users[2];
        var bob = users[3];

        // 2. Create Organization
        var org = new Organization
        {
            Name = "Acme Corporation",
            Slug = "acme-corp",
            CreatedBy = adminUser.Id,
            UpdatedBy = adminUser.Id
        };
        _db.Organizations.Add(org);
        await _db.SaveChangesAsync();

        // 3. Create Organization Config
        var orgConfig = new OrganizationConfig
        {
            OrganizationId = org.Id,
            DefaultPointsScale = "fibonacci",
            IterationLengthDays = 14
        };
        _db.OrganizationConfigs.Add(orgConfig);
        await _db.SaveChangesAsync();

        // 4. Create Organization Members
        var orgMembers = new List<OrganizationMember>
        {
            new OrganizationMember
            {
                OrganizationId = org.Id,
                UserId = adminUser.Id,
                Email = adminUser.Email,
                Role = OrgMemberRole.Admin,
                Status = OrgMemberStatus.Active,
                JoinedAt = DateTime.UtcNow,
                InvitedAt = DateTime.UtcNow
            },
            new OrganizationMember
            {
                OrganizationId = org.Id,
                UserId = john.Id,
                Email = john.Email,
                Role = OrgMemberRole.Member,
                Status = OrgMemberStatus.Active,
                JoinedAt = DateTime.UtcNow,
                InvitedAt = DateTime.UtcNow,
                InvitedBy = adminUser.Id
            },
            new OrganizationMember
            {
                OrganizationId = org.Id,
                UserId = jane.Id,
                Email = jane.Email,
                Role = OrgMemberRole.Member,
                Status = OrgMemberStatus.Active,
                JoinedAt = DateTime.UtcNow,
                InvitedAt = DateTime.UtcNow,
                InvitedBy = adminUser.Id
            },
            new OrganizationMember
            {
                OrganizationId = org.Id,
                UserId = bob.Id,
                Email = bob.Email,
                Role = OrgMemberRole.Viewer,
                Status = OrgMemberStatus.Active,
                JoinedAt = DateTime.UtcNow,
                InvitedAt = DateTime.UtcNow,
                InvitedBy = adminUser.Id
            }
        };
        _db.OrganizationMembers.AddRange(orgMembers);
        await _db.SaveChangesAsync();

        var adminMember = orgMembers[0];
        var johnMember = orgMembers[1];
        var janeMember = orgMembers[2];

        // 5. Create Products
        var products = new List<Product>
        {
            new Product
            {
                OrganizationId = org.Id,
                Name = "Web Platform",
                Description = "Main web application and customer portal",
                CreatedBy = adminUser.Id,
                UpdatedBy = adminUser.Id
            },
            new Product
            {
                OrganizationId = org.Id,
                Name = "Mobile App",
                Description = "iOS and Android mobile applications",
                CreatedBy = adminUser.Id,
                UpdatedBy = adminUser.Id
            }
        };
        _db.Products.AddRange(products);
        await _db.SaveChangesAsync();

        var webProduct = products[0];
        var mobileProduct = products[1];

        // 6. Create Teams
        var teams = new List<Team>
        {
            new Team
            {
                ProductId = webProduct.Id,
                Name = "Frontend Team",
                Description = "Responsible for UI/UX development",
                CreatedBy = adminUser.Id,
                UpdatedBy = adminUser.Id
            },
            new Team
            {
                ProductId = webProduct.Id,
                Name = "Backend Team",
                Description = "Responsible for API and database",
                CreatedBy = adminUser.Id,
                UpdatedBy = adminUser.Id
            },
            new Team
            {
                ProductId = mobileProduct.Id,
                Name = "Mobile Team",
                Description = "iOS and Android development",
                CreatedBy = adminUser.Id,
                UpdatedBy = adminUser.Id
            }
        };
        _db.Teams.AddRange(teams);
        await _db.SaveChangesAsync();

        var frontendTeam = teams[0];
        var backendTeam = teams[1];
        var mobileTeam = teams[2];

        // 7. Create Team Members
        var teamMembers = new List<TeamMember>
        {
            new TeamMember { TeamId = frontendTeam.Id, OrgMemberId = adminMember.Id, Role = TeamMemberRole.Admin, CreatedBy = adminUser.Id, UpdatedBy = adminUser.Id },
            new TeamMember { TeamId = frontendTeam.Id, OrgMemberId = janeMember.Id, Role = TeamMemberRole.Member, CreatedBy = adminUser.Id, UpdatedBy = adminUser.Id },
            new TeamMember { TeamId = backendTeam.Id, OrgMemberId = johnMember.Id, Role = TeamMemberRole.Admin, CreatedBy = adminUser.Id, UpdatedBy = adminUser.Id },
            new TeamMember { TeamId = mobileTeam.Id, OrgMemberId = johnMember.Id, Role = TeamMemberRole.Member, CreatedBy = adminUser.Id, UpdatedBy = adminUser.Id }
        };
        _db.TeamMembers.AddRange(teamMembers);
        await _db.SaveChangesAsync();

        var adminTeamMember = teamMembers[0];
        var janeTeamMember = teamMembers[1];
        var johnTeamMember = teamMembers[2];

        // 8. Create Iterations
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var iterations = new List<Iteration>
        {
            new Iteration
            {
                TeamId = frontendTeam.Id,
                Name = "Sprint 1",
                StartDate = today.AddDays(-14),
                EndDate = today.AddDays(-1),
                Goal = "Setup project infrastructure",
                Status = IterationStatus.Completed,
                CreatedBy = adminUser.Id,
                UpdatedBy = adminUser.Id
            },
            new Iteration
            {
                TeamId = frontendTeam.Id,
                Name = "Sprint 2",
                StartDate = today,
                EndDate = today.AddDays(13),
                Goal = "Implement user authentication",
                Status = IterationStatus.Active,
                CreatedBy = adminUser.Id,
                UpdatedBy = adminUser.Id
            },
            new Iteration
            {
                TeamId = backendTeam.Id,
                Name = "Sprint 1",
                StartDate = today,
                EndDate = today.AddDays(13),
                Goal = "Create API endpoints",
                Status = IterationStatus.Active,
                CreatedBy = adminUser.Id,
                UpdatedBy = adminUser.Id
            }
        };
        _db.Iterations.AddRange(iterations);
        await _db.SaveChangesAsync();

        var sprint1 = iterations[0];
        var sprint2 = iterations[1];
        var backendSprint1 = iterations[2];

        // 9. Create Work Items
        var workItems = new List<WorkItem>
        {
            new WorkItem
            {
                TeamId = frontendTeam.Id,
                IterationId = sprint2.Id,
                AssignedTo = janeTeamMember.Id,
                Title = "Design login page",
                Description = "Create mockups and design for the login page",
                Points = 5,
                Type = WorkItemType.Story,
                Priority = WorkItemPriority.High,
                Status = WorkItemStatus.InProgress,
                CreatedBy = adminUser.Id,
                UpdatedBy = adminUser.Id
            },
            new WorkItem
            {
                TeamId = frontendTeam.Id,
                IterationId = sprint2.Id,
                Title = "Implement forgot password",
                Description = "Add forgot password functionality",
                Points = 3,
                Type = WorkItemType.Task,
                Priority = WorkItemPriority.Medium,
                Status = WorkItemStatus.Todo,
                CreatedBy = adminUser.Id,
                UpdatedBy = adminUser.Id
            },
            new WorkItem
            {
                TeamId = backendTeam.Id,
                IterationId = backendSprint1.Id,
                AssignedTo = johnTeamMember.Id,
                Title = "Create User API endpoints",
                Description = "REST endpoints for user management",
                Points = 8,
                Type = WorkItemType.Story,
                Priority = WorkItemPriority.High,
                Status = WorkItemStatus.InProgress,
                CreatedBy = adminUser.Id,
                UpdatedBy = adminUser.Id
            },
            new WorkItem
            {
                TeamId = backendTeam.Id,
                Title = "Fix authentication bug",
                Description = "Token refresh not working properly",
                Type = WorkItemType.Bug,
                Priority = WorkItemPriority.Critical,
                Status = WorkItemStatus.Backlog,
                CreatedBy = john.Id,
                UpdatedBy = john.Id
            }
        };
        _db.WorkItems.AddRange(workItems);
        await _db.SaveChangesAsync();

        var workItem1 = workItems[0];
        var workItem2 = workItems[1];
        var workItem3 = workItems[2];

        // 10. Create Work Item Comments
        var comments = new List<WorkItemComment>
        {
            new WorkItemComment
            {
                WorkItemId = workItem1.Id,
                AuthorId = adminMember.Id,
                Message = "Please make sure to follow our design system guidelines"
            },
            new WorkItemComment
            {
                WorkItemId = workItem1.Id,
                AuthorId = janeMember.Id,
                Message = "Will do! I'll use the existing component library"
            },
            new WorkItemComment
            {
                WorkItemId = workItem3.Id,
                AuthorId = johnMember.Id,
                Message = "Started working on this, should be done by EOD"
            }
        };
        _db.WorkItemComments.AddRange(comments);
        await _db.SaveChangesAsync();

        // 11. Create Work Item History
        var history = new List<WorkItemHistory>
        {
            new WorkItemHistory
            {
                WorkItemId = workItem1.Id,
                FieldName = "Status",
                OldValue = "Todo",
                NewValue = "InProgress",
                ChangedBy = janeMember.Id,
                ChangedAt = DateTime.UtcNow.AddHours(-2)
            },
            new WorkItemHistory
            {
                WorkItemId = workItem1.Id,
                FieldName = "AssignedTo",
                OldValue = null,
                NewValue = janeMember.Id.ToString(),
                ChangedBy = adminMember.Id,
                ChangedAt = DateTime.UtcNow.AddHours(-3)
            },
            new WorkItemHistory
            {
                WorkItemId = workItem3.Id,
                FieldName = "Status",
                OldValue = "Todo",
                NewValue = "InProgress",
                ChangedBy = johnMember.Id,
                ChangedAt = DateTime.UtcNow.AddHours(-1)
            }
        };
        _db.WorkItemHistories.AddRange(history);
        await _db.SaveChangesAsync();

        // 12. Create Member Absences
        var absences = new List<MemberAbsence>
        {
            new MemberAbsence
            {
                OrgMemberId = janeMember.Id,
                FromDate = today.AddDays(7),
                ToDate = today.AddDays(9),
                Reason = AbsenceReason.Vacation,
                CreatedBy = jane.Id,
                UpdatedBy = jane.Id
            },
            new MemberAbsence
            {
                OrgMemberId = johnMember.Id,
                FromDate = today.AddDays(-1),
                ToDate = today.AddDays(-1),
                Reason = AbsenceReason.Sick,
                CreatedBy = john.Id,
                UpdatedBy = john.Id
            }
        };
        _db.MemberAbsences.AddRange(absences);
        await _db.SaveChangesAsync();

        return Ok(new
        {
            message = "All seed data created successfully!",
            data = new
            {
                users = users.Count,
                organizations = 1,
                organizationMembers = orgMembers.Count,
                products = products.Count,
                teams = teams.Count,
                teamMembers = teamMembers.Count,
                iterations = iterations.Count,
                workItems = workItems.Count,
                comments = comments.Count,
                history = history.Count,
                absences = absences.Count,
                config = 1
            },
            ids = new
            {
                organizationId = org.Id,
                adminUserId = adminUser.Id,
                firstProductId = webProduct.Id,
                firstTeamId = frontendTeam.Id
            }
        });
    }

    [HttpGet("verify")]
    public async Task<IActionResult> Verify()
    {
        var counts = new
        {
            users = await _db.Users.CountAsync(),
            organizations = await _db.Organizations.CountAsync(),
            organizationConfigs = await _db.OrganizationConfigs.CountAsync(),
            organizationMembers = await _db.OrganizationMembers.CountAsync(),
            products = await _db.Products.CountAsync(),
            teams = await _db.Teams.CountAsync(),
            teamMembers = await _db.TeamMembers.CountAsync(),
            iterations = await _db.Iterations.CountAsync(),
            workItems = await _db.WorkItems.CountAsync(),
            workItemComments = await _db.WorkItemComments.CountAsync(),
            workItemHistory = await _db.WorkItemHistories.CountAsync(),
            memberAbsences = await _db.MemberAbsences.CountAsync(),
            refreshTokens = await _db.RefreshTokens.CountAsync()
        };

        var sampleData = new
        {
            users = await _db.Users.Select(u => new { u.Id, u.Name, u.Email, u.Role }).ToListAsync(),
            organizations = await _db.Organizations.Select(o => new { o.Id, o.Name, o.Slug }).ToListAsync(),
            products = await _db.Products.Select(p => new { p.Id, p.Name, p.OrganizationId }).ToListAsync(),
            teams = await _db.Teams.Select(t => new { t.Id, t.Name, t.ProductId }).ToListAsync()
        };

        return Ok(new
        {
            counts,
            sampleData
        });
    }

    [HttpDelete("cleanup")]
    public async Task<IActionResult> Cleanup()
    {
        // Delete in reverse order of dependencies
        _db.WorkItemHistories.RemoveRange(_db.WorkItemHistories);
        _db.WorkItemComments.RemoveRange(_db.WorkItemComments);
        _db.WorkItems.RemoveRange(_db.WorkItems);
        _db.Iterations.RemoveRange(_db.Iterations);
        _db.TeamMembers.RemoveRange(_db.TeamMembers);
        _db.MemberAbsences.RemoveRange(_db.MemberAbsences);
        _db.Teams.RemoveRange(_db.Teams);
        _db.Products.RemoveRange(_db.Products);
        _db.OrganizationConfigs.RemoveRange(_db.OrganizationConfigs);
        _db.OrganizationMembers.RemoveRange(_db.OrganizationMembers);
        _db.Organizations.RemoveRange(_db.Organizations);
        _db.RefreshTokens.RemoveRange(_db.RefreshTokens);
        _db.Users.RemoveRange(_db.Users);
        await _db.SaveChangesAsync();

        return Ok(new { message = "All test data cleaned up successfully!" });
    }
}