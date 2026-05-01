using iterimApi.Data;
using iterimApi.DTOs.Tags;
using iterimApi.Models.Entities;
using iterimApi.Models.Enums;
using iterimApi.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace iterimApi.Services.Implementations;

public class TagService : ITagService
{
    private readonly AppDbContext _db;

    public TagService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<IEnumerable<TagDto>> GetOrgTagsAsync(int orgId, int userId)
    {
        await EnsureOrgMember(orgId, userId);

        return await _db.Tags
            .Where(t => t.OrganizationId == orgId)
            .OrderBy(t => t.Name)
            .Select(t => MapToDto(t))
            .ToListAsync();
    }

    public async Task<TagDto> CreateTagAsync(int orgId, CreateTagDto dto, int userId)
    {
        await EnsureOrgAdmin(orgId, userId);

        var normalizedName = dto.Name.Trim();
        var exists = await _db.Tags.AnyAsync(t => t.OrganizationId == orgId && t.Name == normalizedName);
        if (exists)
            throw new InvalidOperationException($"Tag '{normalizedName}' already exists in this organization");

        var tag = new Tag
        {
            OrganizationId = orgId,
            Name = normalizedName,
            Color = string.IsNullOrWhiteSpace(dto.Color) ? "#6366f1" : dto.Color,
            CreatedAt = DateTime.UtcNow
        };

        _db.Tags.Add(tag);
        await _db.SaveChangesAsync();

        return MapToDto(tag);
    }

    public async Task<bool> DeleteTagAsync(int orgId, int tagId, int userId)
    {
        await EnsureOrgAdmin(orgId, userId);

        var tag = await _db.Tags.FirstOrDefaultAsync(t => t.Id == tagId && t.OrganizationId == orgId);
        if (tag == null)
            return false;

        _db.Tags.Remove(tag);
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<IEnumerable<TagDto>> AssignTagsToWorkItemAsync(int workItemId, AssignTagsDto dto, int userId)
    {
        var workItem = await _db.WorkItems
            .Include(wi => wi.Team)
                .ThenInclude(t => t.Product)
            .FirstOrDefaultAsync(wi => wi.Id == workItemId);

        if (workItem == null)
            throw new KeyNotFoundException("Work item not found");

        var orgId = workItem.Team.Product.OrganizationId;
        await EnsureOrgMember(orgId, userId);

        // Validate all tag ids belong to this org
        await ValidateTagsInOrg(dto.TagIds, orgId);

        // Replace all existing tags
        var existing = await _db.WorkItemTags.Where(wit => wit.WorkItemId == workItemId).ToListAsync();
        _db.WorkItemTags.RemoveRange(existing);

        foreach (var tagId in dto.TagIds.Distinct())
        {
            _db.WorkItemTags.Add(new WorkItemTag { WorkItemId = workItemId, TagId = tagId });
        }

        await _db.SaveChangesAsync();

        return await _db.Tags
            .Where(t => dto.TagIds.Contains(t.Id))
            .Select(t => MapToDto(t))
            .ToListAsync();
    }

    public async Task<IEnumerable<TagDto>> AssignTagsToTeamMemberAsync(int teamId, int teamMemberId, AssignTagsDto dto, int userId)
    {
        var team = await _db.Teams
            .Include(t => t.Product)
            .FirstOrDefaultAsync(t => t.Id == teamId);

        if (team == null)
            throw new KeyNotFoundException("Team not found");

        var orgId = team.Product.OrganizationId;

        // Caller must be team admin OR org admin
        await EnsureTeamAdminOrOrgAdmin(teamId, orgId, userId);

        var teamMember = await _db.TeamMembers.FirstOrDefaultAsync(tm => tm.Id == teamMemberId && tm.TeamId == teamId);
        if (teamMember == null)
            throw new KeyNotFoundException("Team member not found");

        // Validate all tag ids belong to this org
        await ValidateTagsInOrg(dto.TagIds, orgId);

        // Replace all existing tags
        var existing = await _db.TeamMemberTags.Where(tmt => tmt.TeamMemberId == teamMemberId).ToListAsync();
        _db.TeamMemberTags.RemoveRange(existing);

        foreach (var tagId in dto.TagIds.Distinct())
        {
            _db.TeamMemberTags.Add(new TeamMemberTag { TeamMemberId = teamMemberId, TagId = tagId });
        }

        await _db.SaveChangesAsync();

        return await _db.Tags
            .Where(t => dto.TagIds.Contains(t.Id))
            .Select(t => MapToDto(t))
            .ToListAsync();
    }

    // ── Helpers ──────────────────────────────────────────────

    private async Task EnsureOrgMember(int orgId, int userId)
    {
        var org = await _db.Organizations.AnyAsync(o => o.Id == orgId);
        if (!org)
            throw new KeyNotFoundException("Organization not found");

        var isMember = await _db.OrganizationMembers
            .AnyAsync(m => m.OrganizationId == orgId && m.UserId == userId && m.Status == OrgMemberStatus.Active);

        if (!isMember)
            throw new UnauthorizedAccessException("User is not a member of this organization");
    }

    private async Task EnsureOrgAdmin(int orgId, int userId)
    {
        var org = await _db.Organizations.AnyAsync(o => o.Id == orgId);
        if (!org)
            throw new KeyNotFoundException("Organization not found");

        var member = await _db.OrganizationMembers
            .FirstOrDefaultAsync(m => m.OrganizationId == orgId && m.UserId == userId && m.Status == OrgMemberStatus.Active);

        if (member == null)
            throw new UnauthorizedAccessException("User is not a member of this organization");

        if (member.Role != OrgMemberRole.Admin)
            throw new UnauthorizedAccessException("Only organization admins can manage tags");
    }

    private async Task EnsureTeamAdminOrOrgAdmin(int teamId, int orgId, int userId)
    {
        var orgMember = await _db.OrganizationMembers
            .FirstOrDefaultAsync(m => m.OrganizationId == orgId && m.UserId == userId && m.Status == OrgMemberStatus.Active);

        if (orgMember == null)
            throw new UnauthorizedAccessException("User is not a member of this organization");

        if (orgMember.Role == OrgMemberRole.Admin)
            return;

        var teamMember = await _db.TeamMembers
            .FirstOrDefaultAsync(tm => tm.TeamId == teamId && tm.OrgMemberId == orgMember.Id);

        if (teamMember == null || teamMember.Role != TeamMemberRole.Admin)
            throw new UnauthorizedAccessException("Only team admins or organization admins can assign tags to members");
    }

    private async Task ValidateTagsInOrg(List<int> tagIds, int orgId)
    {
        if (tagIds.Count == 0)
            return;

        var validCount = await _db.Tags.CountAsync(t => tagIds.Contains(t.Id) && t.OrganizationId == orgId);
        if (validCount != tagIds.Distinct().Count())
            throw new InvalidOperationException("One or more tags do not belong to this organization");
    }

    private static TagDto MapToDto(Tag t) => new()
    {
        Id = t.Id,
        OrganizationId = t.OrganizationId,
        Name = t.Name,
        Color = t.Color,
        CreatedAt = t.CreatedAt
    };
}
