using iterimApi.Data;
using iterimApi.DTOs.Tags;
using iterimApi.Models.Entities;
using iterimApi.Models.Enums;
using iterimApi.Services.Implementations;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace iterimApi.Tests;

public class TagServiceTests
{
    // ── Fixtures ──────────────────────────────────────────────

    private static AppDbContext CreateDb()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }

    private static TagService CreateService(AppDbContext db) => new(db);

    private static async Task<(Organization org, User adminUser, User memberUser, int adminUserId, int memberUserId)>
        SeedOrgWithUsers(AppDbContext db)
    {
        var adminUser = new User { Name = "Admin", Email = "admin@test.com", Role = UserRole.User };
        var memberUser = new User { Name = "Member", Email = "member@test.com", Role = UserRole.User };
        db.Users.AddRange(adminUser, memberUser);
        await db.SaveChangesAsync();

        var org = new Organization
        {
            Name = "Test Org",
            Slug = "test-org",
            CreatedBy = adminUser.Id,
            UpdatedBy = adminUser.Id
        };
        db.Organizations.Add(org);
        await db.SaveChangesAsync();

        db.OrganizationMembers.AddRange(
            new OrganizationMember
            {
                OrganizationId = org.Id,
                UserId = adminUser.Id,
                Email = adminUser.Email,
                Role = OrgMemberRole.Admin,
                Status = OrgMemberStatus.Active
            },
            new OrganizationMember
            {
                OrganizationId = org.Id,
                UserId = memberUser.Id,
                Email = memberUser.Email,
                Role = OrgMemberRole.Member,
                Status = OrgMemberStatus.Active
            }
        );
        await db.SaveChangesAsync();

        return (org, adminUser, memberUser, adminUser.Id, memberUser.Id);
    }

    // ── GetOrgTags ────────────────────────────────────────────

    [Fact]
    public async Task GetOrgTags_ReturnsTagsForOrgMember()
    {
        using var db = CreateDb();
        var svc = CreateService(db);
        var (org, _, _, adminId, _) = await SeedOrgWithUsers(db);

        db.Tags.Add(new Tag { OrganizationId = org.Id, Name = "frontend", Color = "#blue" });
        await db.SaveChangesAsync();

        var tags = await svc.GetOrgTagsAsync(org.Id, adminId);

        Assert.Single(tags);
        Assert.Equal("frontend", tags.First().Name);
    }

    [Fact]
    public async Task GetOrgTags_ThrowsForNonMember()
    {
        using var db = CreateDb();
        var svc = CreateService(db);
        var (org, _, _, _, _) = await SeedOrgWithUsers(db);

        var outsider = new User { Name = "Out", Email = "out@test.com", Role = UserRole.User };
        db.Users.Add(outsider);
        await db.SaveChangesAsync();

        await Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => svc.GetOrgTagsAsync(org.Id, outsider.Id));
    }

    // ── CreateTag ─────────────────────────────────────────────

    [Fact]
    public async Task CreateTag_AdminCanCreateTag()
    {
        using var db = CreateDb();
        var svc = CreateService(db);
        var (org, _, _, adminId, _) = await SeedOrgWithUsers(db);

        var dto = new CreateTagDto { Name = "backend", Color = "#22c55e" };
        var tag = await svc.CreateTagAsync(org.Id, dto, adminId);

        Assert.Equal("backend", tag.Name);
        Assert.Equal("#22c55e", tag.Color);
        Assert.Equal(org.Id, tag.OrganizationId);
    }

    [Fact]
    public async Task CreateTag_MemberCannotCreateTag()
    {
        using var db = CreateDb();
        var svc = CreateService(db);
        var (org, _, _, _, memberId) = await SeedOrgWithUsers(db);

        var dto = new CreateTagDto { Name = "devops" };

        await Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => svc.CreateTagAsync(org.Id, dto, memberId));
    }

    [Fact]
    public async Task CreateTag_DuplicateNameThrows()
    {
        using var db = CreateDb();
        var svc = CreateService(db);
        var (org, _, _, adminId, _) = await SeedOrgWithUsers(db);

        await svc.CreateTagAsync(org.Id, new CreateTagDto { Name = "design" }, adminId);

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => svc.CreateTagAsync(org.Id, new CreateTagDto { Name = "design" }, adminId));
    }

    // ── DeleteTag ─────────────────────────────────────────────

    [Fact]
    public async Task DeleteTag_AdminCanDelete()
    {
        using var db = CreateDb();
        var svc = CreateService(db);
        var (org, _, _, adminId, _) = await SeedOrgWithUsers(db);

        var tag = new Tag { OrganizationId = org.Id, Name = "testing", Color = "#aaa" };
        db.Tags.Add(tag);
        await db.SaveChangesAsync();

        var result = await svc.DeleteTagAsync(org.Id, tag.Id, adminId);

        Assert.True(result);
        Assert.False(await db.Tags.AnyAsync(t => t.Id == tag.Id));
    }

    [Fact]
    public async Task DeleteTag_MemberCannotDelete()
    {
        using var db = CreateDb();
        var svc = CreateService(db);
        var (org, _, _, adminId, memberId) = await SeedOrgWithUsers(db);

        var tag = new Tag { OrganizationId = org.Id, Name = "testing", Color = "#aaa" };
        db.Tags.Add(tag);
        await db.SaveChangesAsync();

        await Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => svc.DeleteTagAsync(org.Id, tag.Id, memberId));
    }

    [Fact]
    public async Task DeleteTag_ReturnsFalseForNonExistentTag()
    {
        using var db = CreateDb();
        var svc = CreateService(db);
        var (org, _, _, adminId, _) = await SeedOrgWithUsers(db);

        var result = await svc.DeleteTagAsync(org.Id, 9999, adminId);

        Assert.False(result);
    }

    // ── AssignTagsToWorkItem ──────────────────────────────────

    [Fact]
    public async Task AssignTagsToWorkItem_ReplacesExistingTags()
    {
        using var db = CreateDb();
        var svc = CreateService(db);
        var (org, adminUser, _, adminId, _) = await SeedOrgWithUsers(db);

        var product = new Product { OrganizationId = org.Id, Name = "P", CreatedBy = adminId, UpdatedBy = adminId };
        db.Products.Add(product);
        await db.SaveChangesAsync();

        var team = new Team { ProductId = product.Id, Name = "T", CreatedBy = adminId, UpdatedBy = adminId };
        db.Teams.Add(team);
        await db.SaveChangesAsync();

        var orgMember = await db.OrganizationMembers.FirstAsync(m => m.UserId == adminId);
        var teamMember = new TeamMember { TeamId = team.Id, OrgMemberId = orgMember.Id, Role = TeamMemberRole.Admin, CreatedBy = adminId, UpdatedBy = adminId };
        db.TeamMembers.Add(teamMember);
        await db.SaveChangesAsync();

        var workItem = new WorkItem
        {
            TeamId = team.Id, Title = "WI", Type = WorkItemType.Task,
            Priority = WorkItemPriority.Medium, Status = WorkItemStatus.Backlog,
            CreatedBy = adminId, UpdatedBy = adminId
        };
        db.WorkItems.Add(workItem);

        var tag1 = new Tag { OrganizationId = org.Id, Name = "fe", Color = "#1" };
        var tag2 = new Tag { OrganizationId = org.Id, Name = "be", Color = "#2" };
        db.Tags.AddRange(tag1, tag2);
        await db.SaveChangesAsync();

        // Assign tag1 first
        await svc.AssignTagsToWorkItemAsync(workItem.Id, new AssignTagsDto { TagIds = [tag1.Id] }, adminId);

        // Replace with tag2 only
        var result = await svc.AssignTagsToWorkItemAsync(workItem.Id, new AssignTagsDto { TagIds = [tag2.Id] }, adminId);

        Assert.Single(result);
        Assert.Equal(tag2.Id, result.First().Id);
        Assert.Equal(1, await db.WorkItemTags.CountAsync(wit => wit.WorkItemId == workItem.Id));
    }

    [Fact]
    public async Task AssignTagsToWorkItem_TagFromOtherOrgThrows()
    {
        using var db = CreateDb();
        var svc = CreateService(db);
        var (org, adminUser, _, adminId, _) = await SeedOrgWithUsers(db);

        var product = new Product { OrganizationId = org.Id, Name = "P", CreatedBy = adminId, UpdatedBy = adminId };
        db.Products.Add(product);
        await db.SaveChangesAsync();

        var team = new Team { ProductId = product.Id, Name = "T", CreatedBy = adminId, UpdatedBy = adminId };
        db.Teams.Add(team);
        await db.SaveChangesAsync();

        var orgMember = await db.OrganizationMembers.FirstAsync(m => m.UserId == adminId);
        db.TeamMembers.Add(new TeamMember { TeamId = team.Id, OrgMemberId = orgMember.Id, Role = TeamMemberRole.Admin, CreatedBy = adminId, UpdatedBy = adminId });

        var workItem = new WorkItem
        {
            TeamId = team.Id, Title = "WI", Type = WorkItemType.Task,
            Priority = WorkItemPriority.Medium, Status = WorkItemStatus.Backlog,
            CreatedBy = adminId, UpdatedBy = adminId
        };
        db.WorkItems.Add(workItem);

        // Tag from a different org
        var otherOrg = new Organization { Name = "Other", Slug = "other", CreatedBy = adminId, UpdatedBy = adminId };
        db.Organizations.Add(otherOrg);
        await db.SaveChangesAsync();
        var foreignTag = new Tag { OrganizationId = otherOrg.Id, Name = "alien", Color = "#f" };
        db.Tags.Add(foreignTag);
        await db.SaveChangesAsync();

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => svc.AssignTagsToWorkItemAsync(workItem.Id, new AssignTagsDto { TagIds = [foreignTag.Id] }, adminId));
    }

    // ── AssignTagsToTeamMember ────────────────────────────────

    [Fact]
    public async Task AssignTagsToTeamMember_TeamAdminCanAssign()
    {
        using var db = CreateDb();
        var svc = CreateService(db);
        var (org, adminUser, memberUser, adminId, memberId) = await SeedOrgWithUsers(db);

        var product = new Product { OrganizationId = org.Id, Name = "P", CreatedBy = adminId, UpdatedBy = adminId };
        db.Products.Add(product);
        await db.SaveChangesAsync();

        var team = new Team { ProductId = product.Id, Name = "T", CreatedBy = adminId, UpdatedBy = adminId };
        db.Teams.Add(team);
        await db.SaveChangesAsync();

        var adminOrgMember = await db.OrganizationMembers.FirstAsync(m => m.UserId == adminId);
        var memberOrgMember = await db.OrganizationMembers.FirstAsync(m => m.UserId == memberId);

        var adminTeamMember = new TeamMember { TeamId = team.Id, OrgMemberId = adminOrgMember.Id, Role = TeamMemberRole.Admin, CreatedBy = adminId, UpdatedBy = adminId };
        var regularTeamMember = new TeamMember { TeamId = team.Id, OrgMemberId = memberOrgMember.Id, Role = TeamMemberRole.Member, CreatedBy = adminId, UpdatedBy = adminId };
        db.TeamMembers.AddRange(adminTeamMember, regularTeamMember);

        var tag = new Tag { OrganizationId = org.Id, Name = "design", Color = "#d" };
        db.Tags.Add(tag);
        await db.SaveChangesAsync();

        var result = await svc.AssignTagsToTeamMemberAsync(team.Id, regularTeamMember.Id, new AssignTagsDto { TagIds = [tag.Id] }, adminId);

        Assert.Single(result);
        Assert.Equal("design", result.First().Name);
    }

    [Fact]
    public async Task AssignTagsToTeamMember_RegularMemberCannotAssign()
    {
        using var db = CreateDb();
        var svc = CreateService(db);
        var (org, adminUser, memberUser, adminId, memberId) = await SeedOrgWithUsers(db);

        var product = new Product { OrganizationId = org.Id, Name = "P", CreatedBy = adminId, UpdatedBy = adminId };
        db.Products.Add(product);
        await db.SaveChangesAsync();

        var team = new Team { ProductId = product.Id, Name = "T", CreatedBy = adminId, UpdatedBy = adminId };
        db.Teams.Add(team);
        await db.SaveChangesAsync();

        var adminOrgMember = await db.OrganizationMembers.FirstAsync(m => m.UserId == adminId);
        var memberOrgMember = await db.OrganizationMembers.FirstAsync(m => m.UserId == memberId);

        var adminTeamMember = new TeamMember { TeamId = team.Id, OrgMemberId = adminOrgMember.Id, Role = TeamMemberRole.Admin, CreatedBy = adminId, UpdatedBy = adminId };
        var regularTeamMember = new TeamMember { TeamId = team.Id, OrgMemberId = memberOrgMember.Id, Role = TeamMemberRole.Member, CreatedBy = adminId, UpdatedBy = adminId };
        db.TeamMembers.AddRange(adminTeamMember, regularTeamMember);

        var tag = new Tag { OrganizationId = org.Id, Name = "fe", Color = "#f" };
        db.Tags.Add(tag);
        await db.SaveChangesAsync();

        await Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => svc.AssignTagsToTeamMemberAsync(team.Id, adminTeamMember.Id, new AssignTagsDto { TagIds = [tag.Id] }, memberId));
    }
}
