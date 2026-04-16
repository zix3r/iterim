using iterimApi.Data;
using iterimApi.DTOs.Teams;
using iterimApi.Exceptions;
using iterimApi.Models.Entities;
using iterimApi.Models.Enums;
using iterimApi.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace iterimApi.Services.Implementations;

public class TeamService : ITeamService
{
    private readonly AppDbContext _db;

    public TeamService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<IEnumerable<TeamDto>> GetTeamsByProductAsync(int productId, int userId)
    {
        // Check if product exists and user has access
        var product = await _db.Products
            .Include(p => p.Organization)
            .FirstOrDefaultAsync(p => p.Id == productId);

        if (product == null)
        {
            throw new KeyNotFoundException("Product not found");
        }

        // Check if user is a member of the organization
        var isMember = await _db.OrganizationMembers
            .AnyAsync(m => m.OrganizationId == product.OrganizationId && 
                          m.UserId == userId && 
                          m.Status == OrgMemberStatus.Active);

        if (!isMember)
        {
            throw new UnauthorizedAccessException("User is not a member of this organization");
        }

        // Get all teams for the product
        var teams = await _db.Teams
            .Where(t => t.ProductId == productId)
            .Include(t => t.CreatedByUser)
            .Include(t => t.UpdatedByUser)
            .Include(t => t.Members)
            .Select(t => new TeamDto
            {
                Id = t.Id,
                ProductId = t.ProductId,
                Name = t.Name,
                Description = t.Description,
                CreatedAt = t.CreatedAt,
                UpdatedAt = t.UpdatedAt,
                CreatedBy = t.CreatedBy,
                UpdatedBy = t.UpdatedBy,
                CreatedByName = t.CreatedByUser.Name,
                UpdatedByName = t.UpdatedByUser.Name,
                MemberCount = t.Members.Count
            })
            .ToListAsync();

        return teams;
    }

    public async Task<TeamDetailDto?> GetTeamByIdAsync(int teamId, int userId)
    {
        var team = await _db.Teams
            .Include(t => t.Product)
            .Include(t => t.CreatedByUser)
            .Include(t => t.UpdatedByUser)
            .Include(t => t.Members)
                .ThenInclude(m => m.OrgMember)
                .ThenInclude(om => om.User)
            .FirstOrDefaultAsync(t => t.Id == teamId);

        if (team == null)
        {
            return null;
        }

        // Check if user is a member of the organization
        var isMember = await _db.OrganizationMembers
            .AnyAsync(m => m.OrganizationId == team.Product.OrganizationId && 
                          m.UserId == userId && 
                          m.Status == OrgMemberStatus.Active);

        if (!isMember)
        {
            throw new UnauthorizedAccessException("User is not a member of this organization");
        }

        return new TeamDetailDto
        {
            Id = team.Id,
            ProductId = team.ProductId,
            ProductName = team.Product.Name,
            ProductCreatedBy = team.Product.CreatedBy,
            CurrentUserId = userId,
            Name = team.Name,
            Description = team.Description,
            CreatedAt = team.CreatedAt,
            UpdatedAt = team.UpdatedAt,
            CreatedBy = team.CreatedBy,
            UpdatedBy = team.UpdatedBy,
            CreatedByName = team.CreatedByUser.Name,
            UpdatedByName = team.UpdatedByUser.Name,
            Members = team.Members.Select(m => new TeamMemberDto
            {
                Id = m.Id,
                TeamId = m.TeamId,
                OrgMemberId = m.OrgMemberId,
                UserId = m.OrgMember.UserId,
                UserName = m.OrgMember.User.Name,
                UserEmail = m.OrgMember.User.Email,
                Role = m.Role.ToString(),
                CreatedAt = m.CreatedAt
            }).ToList()
        };
    }

    public async Task<TeamDto?> CreateTeamAsync(int productId, CreateTeamDto dto, int userId)
    {
        // Check if product exists
        var product = await _db.Products
            .Include(p => p.Organization)
            .FirstOrDefaultAsync(p => p.Id == productId);

        if (product == null)
        {
            throw new KeyNotFoundException("Product not found");
        }

        // Check if user is a member of the organization with appropriate permissions
        var member = await _db.OrganizationMembers
            .FirstOrDefaultAsync(m => m.OrganizationId == product.OrganizationId && 
                                     m.UserId == userId && 
                                     m.Status == OrgMemberStatus.Active);

        if (member == null)
        {
            throw new UnauthorizedAccessException("User is not a member of this organization");
        }

        // Only Admin or ProductOwner can create teams
        if (member.Role != OrgMemberRole.Admin /*&& member.Role != OrgMemberRole.ProductOwner*/)
        {
            throw new UnauthorizedAccessException("User does not have permission to create teams");
        }

        var team = new Team
        {
            ProductId = productId,
            Name = dto.Name,
            Description = dto.Description,
            CreatedBy = userId,
            UpdatedBy = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _db.Teams.Add(team);
        await _db.SaveChangesAsync();

        // Automatically add the creator as a team admin
        var creatorTeamMember = new TeamMember
        {
            TeamId = team.Id,
            OrgMemberId = member.Id,
            Role = TeamMemberRole.Admin,
            CreatedBy = userId,
            UpdatedBy = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        
        _db.TeamMembers.Add(creatorTeamMember);
        await _db.SaveChangesAsync();

        // Load navigation properties for DTO
        await _db.Entry(team).Reference(t => t.CreatedByUser).LoadAsync();
        await _db.Entry(team).Reference(t => t.UpdatedByUser).LoadAsync();
        await _db.Entry(team).Collection(t => t.Members).LoadAsync();

        return new TeamDto
        {
            Id = team.Id,
            ProductId = team.ProductId,
            Name = team.Name,
            Description = team.Description,
            CreatedAt = team.CreatedAt,
            UpdatedAt = team.UpdatedAt,
            CreatedBy = team.CreatedBy,
            UpdatedBy = team.UpdatedBy,
            CreatedByName = team.CreatedByUser.Name,
            UpdatedByName = team.UpdatedByUser.Name,
            MemberCount = team.Members.Count
        };
    }

    public async Task<TeamDto?> UpdateTeamAsync(int teamId, UpdateTeamDto dto, int userId)
    {
        // Check if team exists
        var team = await _db.Teams
            .Include(t => t.Product)
            .Include(t => t.CreatedByUser)
            .Include(t => t.UpdatedByUser)
            .Include(t => t.Members)
            .FirstOrDefaultAsync(t => t.Id == teamId);

        if (team == null)
        {
            throw new KeyNotFoundException("Team not found");
        }

        // Check if the requester is a member of the organization
        var requesterMember = await _db.OrganizationMembers
            .FirstOrDefaultAsync(m => m.OrganizationId == team.Product.OrganizationId && 
                                     m.UserId == userId && 
                                     m.Status == OrgMemberStatus.Active);

        if (requesterMember == null)
        {
            throw new UnauthorizedAccessException("User is not a member of this organization");
        }

        // Check if user can manage this team (product creator OR team admin)
        var isProductCreator = team.Product.CreatedBy == userId;
        var isTeamAdmin = await _db.TeamMembers
            .AnyAsync(tm => tm.TeamId == teamId && 
                           tm.OrgMember.UserId == userId && 
                           tm.Role == TeamMemberRole.Admin);

        if (!isProductCreator && !isTeamAdmin)
        {
            throw new UnauthorizedAccessException("Only the product creator or team admin can update the team");
        }

        // Update team properties
        team.Name = dto.Name;
        team.Description = dto.Description;
        team.UpdatedBy = userId;
        team.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        // Reload navigation properties to get updated user names
        await _db.Entry(team).Reference(t => t.UpdatedByUser).LoadAsync();

        return new TeamDto
        {
            Id = team.Id,
            ProductId = team.ProductId,
            Name = team.Name,
            Description = team.Description,
            CreatedAt = team.CreatedAt,
            UpdatedAt = team.UpdatedAt,
            CreatedBy = team.CreatedBy,
            UpdatedBy = team.UpdatedBy,
            CreatedByName = team.CreatedByUser.Name,
            UpdatedByName = team.UpdatedByUser.Name,
            MemberCount = team.Members.Count
        };
    }

    public async Task<TeamMemberDto?> AddTeamMemberAsync(int teamId, AddTeamMemberDto dto, int userId)
    {
        // Check if team exists
        var team = await _db.Teams
            .Include(t => t.Product)
            .FirstOrDefaultAsync(t => t.Id == teamId);

        if (team == null)
        {
            throw new KeyNotFoundException("Team not found");
        }

        // Check if the requester is a member of the organization with appropriate permissions
        var requesterMember = await _db.OrganizationMembers
            .FirstOrDefaultAsync(m => m.OrganizationId == team.Product.OrganizationId && 
                                     m.UserId == userId && 
                                     m.Status == OrgMemberStatus.Active);

        if (requesterMember == null)
        {
            throw new UnauthorizedAccessException("User is not a member of this organization");
        }

        // Check if user can manage this team (product creator OR team admin)
        var isProductCreator = team.Product.CreatedBy == userId;
        var isTeamAdmin = await _db.TeamMembers
            .AnyAsync(tm => tm.TeamId == teamId && 
                           tm.OrgMember.UserId == userId && 
                           tm.Role == TeamMemberRole.Admin);

        if (!isProductCreator && !isTeamAdmin)
        {
            throw new UnauthorizedAccessException("Only the product creator or team admin can add members");
        }

        // Check if the organization member exists
        var orgMember = await _db.OrganizationMembers
            .Include(om => om.User)
            .FirstOrDefaultAsync(om => om.Id == dto.OrgMemberId && 
                                      om.OrganizationId == team.Product.OrganizationId &&
                                      om.Status == OrgMemberStatus.Active);

        if (orgMember == null)
        {
            throw new KeyNotFoundException("Organization member not found or not active");
        }

        // Check if user is already a member of this team
        var existingMember = await _db.TeamMembers
            .FirstOrDefaultAsync(tm => tm.TeamId == teamId && tm.OrgMemberId == dto.OrgMemberId);

        if (existingMember != null)
        {
            throw new InvalidOperationException("User is already a member of this team");
        }

        var teamMember = new TeamMember
        {
            TeamId = teamId,
            OrgMemberId = dto.OrgMemberId,
            Role = dto.Role,
            CreatedBy = userId,
            UpdatedBy = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _db.TeamMembers.Add(teamMember);
        await _db.SaveChangesAsync();

        return new TeamMemberDto
        {
            Id = teamMember.Id,
            TeamId = teamMember.TeamId,
            OrgMemberId = teamMember.OrgMemberId,
            UserId = orgMember.UserId,
            UserName = orgMember.User.Name,
            UserEmail = orgMember.User.Email,
            Role = teamMember.Role.ToString(),
            CreatedAt = teamMember.CreatedAt
        };
    }

    public async Task<TeamMemberDto?> UpdateTeamMemberRoleAsync(int teamId, int memberUserId, UpdateTeamMemberRoleDto dto, int userId)
    {
        // Check if team exists
        var team = await _db.Teams
            .Include(t => t.Product)
            .FirstOrDefaultAsync(t => t.Id == teamId);

        if (team == null)
        {
            throw new KeyNotFoundException("Team not found");
        }

        // Check if the requester is a member of the organization with appropriate permissions
        var requesterMember = await _db.OrganizationMembers
            .FirstOrDefaultAsync(m => m.OrganizationId == team.Product.OrganizationId && 
                                     m.UserId == userId && 
                                     m.Status == OrgMemberStatus.Active);

        if (requesterMember == null)
        {
            throw new UnauthorizedAccessException("User is not a member of this organization");
        }

        // Check if user can manage this team (product creator OR team admin)
        var isProductCreator = team.Product.CreatedBy == userId;
        var isTeamAdmin = await _db.TeamMembers
            .AnyAsync(tm => tm.TeamId == teamId && 
                           tm.OrgMember.UserId == userId && 
                           tm.Role == TeamMemberRole.Admin);

        if (!isProductCreator && !isTeamAdmin)
        {
            throw new UnauthorizedAccessException("Only the product creator or team admin can update member roles");
        }

        // Find the team member to update
        var teamMember = await _db.TeamMembers
            .Include(tm => tm.OrgMember)
                .ThenInclude(om => om.User)
            .FirstOrDefaultAsync(tm => tm.TeamId == teamId && tm.OrgMember.UserId == memberUserId);

        if (teamMember == null)
        {
            throw new KeyNotFoundException("Team member not found");
        }

        // If trying to demote from Admin to Member, check if user is the team creator and the only admin
        if (teamMember.Role == TeamMemberRole.Admin && dto.Role == TeamMemberRole.Member)
        {
            var isTeamCreator = team.CreatedBy == memberUserId;
            if (isTeamCreator)
            {
                // Count how many admins are in the team
                var adminCount = await _db.TeamMembers
                    .CountAsync(tm => tm.TeamId == teamId && tm.Role == TeamMemberRole.Admin);

                if (adminCount <= 1)
                {
                    throw new InvalidOperationException("Cannot demote the team creator from admin when they are the only admin. Add another admin first.");
                }
            }
        }

        // Update the role
        teamMember.Role = dto.Role;
        teamMember.UpdatedBy = userId;
        teamMember.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return new TeamMemberDto
        {
            Id = teamMember.Id,
            TeamId = teamMember.TeamId,
            OrgMemberId = teamMember.OrgMemberId,
            UserId = teamMember.OrgMember.UserId,
            UserName = teamMember.OrgMember.User.Name,
            UserEmail = teamMember.OrgMember.User.Email,
            Role = teamMember.Role.ToString(),
            CreatedAt = teamMember.CreatedAt
        };
    }

    public async Task<bool> RemoveTeamMemberAsync(int teamId, int userId, int memberUserId)
    {
        // Check if team exists
        var team = await _db.Teams
            .Include(t => t.Product)
            .FirstOrDefaultAsync(t => t.Id == teamId);

        if (team == null)
        {
            throw new KeyNotFoundException("Team not found");
        }

        // Check if the requester is a member of the organization with appropriate permissions
        var requesterMember = await _db.OrganizationMembers
            .FirstOrDefaultAsync(m => m.OrganizationId == team.Product.OrganizationId && 
                                     m.UserId == userId && 
                                     m.Status == OrgMemberStatus.Active);

        if (requesterMember == null)
        {
            throw new UnauthorizedAccessException("User is not a member of this organization");
        }

        // Check if user can manage this team (product creator OR team admin)
        var isProductCreator = team.Product.CreatedBy == userId;
        var isTeamAdmin = await _db.TeamMembers
            .AnyAsync(tm => tm.TeamId == teamId && 
                           tm.OrgMember.UserId == userId && 
                           tm.Role == TeamMemberRole.Admin);

        if (!isProductCreator && !isTeamAdmin)
        {
            throw new UnauthorizedAccessException("Only the product creator or team admin can remove members");
        }

        // Find the team member to remove
        var teamMember = await _db.TeamMembers
            .Include(tm => tm.OrgMember)
            .FirstOrDefaultAsync(tm => tm.TeamId == teamId && tm.OrgMember.UserId == memberUserId);

        if (teamMember == null)
        {
            return false;
        }

        // Check if the member being removed is the team creator and the only admin
        var isTeamCreator = team.CreatedBy == memberUserId;
        if (isTeamCreator && teamMember.Role == TeamMemberRole.Admin)
        {
            // Count how many admins are in the team
            var adminCount = await _db.TeamMembers
                .CountAsync(tm => tm.TeamId == teamId && tm.Role == TeamMemberRole.Admin);

            if (adminCount <= 1)
            {
                throw new InvalidOperationException("Cannot remove the team creator when they are the only admin. Add another admin first.");
            }
        }

        _db.TeamMembers.Remove(teamMember);
        await _db.SaveChangesAsync();

        return true;
    }

    public async Task<bool> DeleteTeamAsync(int teamId, int userId)
    {
        // Check if team exists
        var team = await _db.Teams
            .Include(t => t.Product)
            .FirstOrDefaultAsync(t => t.Id == teamId);

        if (team == null)
        {
            throw new KeyNotFoundException("Team not found");
        }

        // Check if the requester is a member of the organization with appropriate permissions
        var requesterMember = await _db.OrganizationMembers
            .FirstOrDefaultAsync(m => m.OrganizationId == team.Product.OrganizationId && 
                                     m.UserId == userId && 
                                     m.Status == OrgMemberStatus.Active);

        if (requesterMember == null)
        {
            throw new UnauthorizedAccessException("User is not a member of this organization");
        }

        // Check if user can manage this team (product creator OR team admin)
        var isProductCreator = team.Product.CreatedBy == userId;
        var isTeamAdmin = await _db.TeamMembers
            .AnyAsync(tm => tm.TeamId == teamId && 
                           tm.OrgMember.UserId == userId && 
                           tm.Role == TeamMemberRole.Admin);

        if (!isProductCreator && !isTeamAdmin)
        {
            throw new UnauthorizedAccessException("Only the product creator or team admin can delete teams");
        }

        var hasActiveIteration = await _db.Iterations
            .AnyAsync(i => i.TeamId == teamId && i.Status == IterationStatus.Active);
        if (hasActiveIteration)
        {
            throw new ConflictException("Cannot delete team while it has an active iteration. Complete it first.");
        }

        _db.Teams.Remove(team);
        await _db.SaveChangesAsync();

        return true;
    }
}
