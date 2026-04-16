using iterimApi.Data;
using iterimApi.Models.Entities;
using iterimApi.Models.Enums;
using Microsoft.AspNetCore.Identity;

namespace iterimApi.Tests.Infrastructure;

public static class TestDataSeeder
{
    public static async Task<User> CreateUserAsync(
        AppDbContext db,
        string email,
        string name,
        string password = "Password123!",
        bool isEmailConfirmed = true)
    {
        var user = new User
        {
            Email = email,
            Name = name,
            IsEmailConfirmed = isEmailConfirmed,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var hasher = new PasswordHasher<User>();
        user.PasswordHash = hasher.HashPassword(user, password);

        db.Users.Add(user);
        await db.SaveChangesAsync();
        return user;
    }

    public static async Task<(Organization Organization, OrganizationMember AdminMembership)>
        CreateOrganizationWithAdminAsync(AppDbContext db, User adminUser, string organizationName = "Test Org")
    {
        var organization = new Organization
        {
            Name = organizationName,
            Slug = $"{organizationName.ToLowerInvariant().Replace(" ", "-")}-{Guid.NewGuid():N}"[..20],
            CreatedBy = adminUser.Id,
            UpdatedBy = adminUser.Id,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        db.Organizations.Add(organization);
        await db.SaveChangesAsync();

        var membership = new OrganizationMember
        {
            OrganizationId = organization.Id,
            UserId = adminUser.Id,
            Email = adminUser.Email,
            Role = OrgMemberRole.Admin,
            Status = OrgMemberStatus.Active,
            JoinedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        db.OrganizationMembers.Add(membership);
        await db.SaveChangesAsync();

        return (organization, membership);
    }

    public static async Task<OrganizationMember> AddOrganizationMemberAsync(
        AppDbContext db,
        Organization organization,
        User user,
        OrgMemberRole role = OrgMemberRole.Member,
        OrgMemberStatus status = OrgMemberStatus.Active)
    {
        var membership = new OrganizationMember
        {
            OrganizationId = organization.Id,
            UserId = user.Id,
            Email = user.Email,
            Role = role,
            Status = status,
            JoinedAt = status == OrgMemberStatus.Active ? DateTime.UtcNow : null,
            InvitedAt = status == OrgMemberStatus.Invited ? DateTime.UtcNow : null,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        db.OrganizationMembers.Add(membership);
        await db.SaveChangesAsync();
        return membership;
    }

    public static async Task<Product> CreateProductAsync(AppDbContext db, Organization organization, User creator, string name = "Product A")
    {
        var product = new Product
        {
            OrganizationId = organization.Id,
            Name = name,
            Description = "Product description",
            CreatedBy = creator.Id,
            UpdatedBy = creator.Id,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        db.Products.Add(product);
        await db.SaveChangesAsync();
        return product;
    }

    public static async Task<Team> CreateTeamAsync(AppDbContext db, Product product, User creator, OrganizationMember orgMember, string name = "Team A")
    {
        var team = new Team
        {
            ProductId = product.Id,
            Name = name,
            Description = "Team description",
            CreatedBy = creator.Id,
            UpdatedBy = creator.Id,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        db.Teams.Add(team);
        await db.SaveChangesAsync();

        var teamMember = new TeamMember
        {
            TeamId = team.Id,
            OrgMemberId = orgMember.Id,
            Role = TeamMemberRole.Admin,
            CreatedBy = creator.Id,
            UpdatedBy = creator.Id,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        db.TeamMembers.Add(teamMember);
        await db.SaveChangesAsync();

        return team;
    }

    public static async Task<TeamMember> AddTeamMemberAsync(
        AppDbContext db,
        Team team,
        OrganizationMember orgMember,
        User actor,
        TeamMemberRole role = TeamMemberRole.Member)
    {
        var teamMember = new TeamMember
        {
            TeamId = team.Id,
            OrgMemberId = orgMember.Id,
            Role = role,
            CreatedBy = actor.Id,
            UpdatedBy = actor.Id,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        db.TeamMembers.Add(teamMember);
        await db.SaveChangesAsync();
        return teamMember;
    }

    public static async Task<Iteration> CreateIterationAsync(
        AppDbContext db,
        Team team,
        User creator,
        string name = "Sprint 1",
        IterationStatus status = IterationStatus.Planning)
    {
        var start = DateOnly.FromDateTime(DateTime.UtcNow.Date);
        var iteration = new Iteration
        {
            TeamId = team.Id,
            Name = name,
            StartDate = start,
            EndDate = start.AddDays(14),
            Status = status,
            CreatedBy = creator.Id,
            UpdatedBy = creator.Id,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        db.Iterations.Add(iteration);
        await db.SaveChangesAsync();
        return iteration;
    }

    public static async Task<WorkItem> CreateWorkItemAsync(
        AppDbContext db,
        Team team,
        User creator,
        string title = "Work Item",
        WorkItemStatus status = WorkItemStatus.Backlog,
        int? iterationId = null,
        int? assignedTo = null)
    {
        var workItem = new WorkItem
        {
            TeamId = team.Id,
            IterationId = iterationId,
            AssignedTo = assignedTo,
            Title = title,
            Description = "Work item description",
            Type = WorkItemType.Story,
            Priority = WorkItemPriority.Medium,
            Points = 3,
            Status = status,
            Position = 0,
            CreatedBy = creator.Id,
            UpdatedBy = creator.Id,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        db.WorkItems.Add(workItem);
        await db.SaveChangesAsync();
        return workItem;
    }
}
