using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using iterimApi.Data; // Pakeiskite į savo DbContext namespace
using iterimApi.DTOs.Organizations;
using iterimApi.Services.Interfaces;
using iterimApi.Models.Entities;
using iterimApi.Models.Enums;

namespace iterimApi.Services.Implementations;

public class OrganizationService : IOrganizationService
{
    private readonly AppDbContext _context; // Pakeiskite į savo konteksto pavadinimą

    public OrganizationService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<OrganizationDto>> GetUserOrganizationsAsync(int userId)
    {
        return await _context.Organizations
            .Where(o => o.Members.Any(m => m.UserId == userId && m.Status == OrgMemberStatus.Active))
            .Select(o => new OrganizationDto
            {
                Id = o.Id,
                Name = o.Name,
                Slug = o.Slug
            })
            .ToListAsync();
    }
    public async Task DeleteOrganizationAsync(int orgId, int userId)
{
    // 1. Patikriname, ar vartotojas priklauso organizacijai ir ar jis yra Adminas
    var membership = await _context.OrganizationMembers
        .FirstOrDefaultAsync(om => om.OrganizationId == orgId && om.UserId == userId);

    if (membership == null)
        throw new KeyNotFoundException("Organization not found.");

    if (membership.Role != iterimApi.Models.Enums.OrgMemberRole.Admin)
    {
    throw new UnauthorizedAccessException("Only Administrators can delete the organization.");
    }
    // 2. Surandame organizaciją
    var org = await _context.Organizations.FindAsync(orgId);
    if (org == null)
        throw new KeyNotFoundException("Organization not found.");

    // 3. Ištriname (Dėka tavo AppDbContext konfigūracijos, tai automatiškai ištrins ir visus produktus, komandas bei užduotis!)
    _context.Organizations.Remove(org);
    await _context.SaveChangesAsync();
}
    public async Task<OrganizationDetailDto> GetOrganizationByIdAsync(int id, int userId)
    {
        var organization = await _context.Organizations
            .Include(o => o.Members)
            .ThenInclude(m => m.User)
            .FirstOrDefaultAsync(o => o.Id == id);

        if (organization == null)
            throw new KeyNotFoundException("Organization not found.");

        var currentUserMember = organization.Members.FirstOrDefault(m => m.UserId == userId);
        if (currentUserMember == null)
            throw new UnauthorizedAccessException("You do not have permission to view this organization.");

        return new OrganizationDetailDto
        {
            Id = organization.Id,
            Name = organization.Name,
            Slug = organization.Slug,
            UserRole = currentUserMember.Role.ToString(),
            CurrentUserId = userId,
            Members = organization.Members
                .Where(m => m.Status != OrgMemberStatus.Removed && m.Status != OrgMemberStatus.Declined)
                .Select(m => new OrganizationMemberDto
                {
                    Id = m.Id,
                    UserId = m.UserId,
                    Email = m.Email,
                    Role = m.Role.ToString(),
                    Status = m.Status.ToString()
                }).ToList()
        };
    }

    public async Task<OrganizationDto> CreateOrganizationAsync(CreateOrganizationDto dto, int userId)
    {
        // Paimame vartotoją, kad gautume jo el. paštą organizacijos narių lentelei
        var user = await _context.Users.FindAsync(userId);
        if (user == null) throw new UnauthorizedAccessException("User not found.");

        var slug = GenerateSlug(dto.Name);

        if (await _context.Organizations.AnyAsync(o => o.Slug == slug))
        {
            slug = $"{slug}-{Guid.NewGuid().ToString().Substring(0, 5)}";
        }

        var organization = new Organization
        {
            Name = dto.Name,
            Slug = slug,
            CreatedBy = userId,
            UpdatedBy = userId,
            Members = new List<OrganizationMember>
            {
                new OrganizationMember
                {
                    UserId = userId,
                    Email = user.Email, // Paimame el. paštą iš User
                    Role = OrgMemberRole.Admin, // Darant prielaidą, kad toks Enum egzistuoja
                    Status = OrgMemberStatus.Active, // Darant prielaidą, kad toks Enum egzistuoja
                    JoinedAt = DateTime.UtcNow
                }
            }
        };

        _context.Organizations.Add(organization);
        await _context.SaveChangesAsync();

        return new OrganizationDto
        {
            Id = organization.Id,
            Name = organization.Name,
            Slug = organization.Slug
        };
    }

    public async Task<OrganizationMemberDto> AddMemberToOrganizationAsync(int organizationId, AddOrganizationMemberDto dto, int currentUserId)
    {
        // Check if organization exists
        var organization = await _context.Organizations
            .Include(o => o.Members)
            .FirstOrDefaultAsync(o => o.Id == organizationId);

        if (organization == null)
            throw new KeyNotFoundException("Organization not found.");

        // Check if current user is an admin of the organization
        var currentUserMember = organization.Members.FirstOrDefault(m => m.UserId == currentUserId);
        if (currentUserMember == null || currentUserMember.Role != OrgMemberRole.Admin)
            throw new UnauthorizedAccessException("Only organization admins can add members.");

        // Check if user with this email exists
        var userToAdd = await _context.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);
        if (userToAdd == null)
            throw new KeyNotFoundException($"User with email '{dto.Email}' not found.");

        // Check if user is already a member
        var existingMember = organization.Members.FirstOrDefault(m => m.UserId == userToAdd.Id);
        
        if (existingMember != null && 
           (existingMember.Status == OrgMemberStatus.Active || existingMember.Status == OrgMemberStatus.Invited))
        {
            throw new InvalidOperationException($"User '{dto.Email}' is already a member of this organization.");
        }

        // Parse the role from string to enum
        if (!Enum.TryParse<OrgMemberRole>(dto.Role, true, out var role))
            throw new ArgumentException($"Invalid role: {dto.Role}. Valid roles are: Admin, Member, Viewer");

        if (existingMember != null)
        {
             // Re-invite existing (removed/declined) member
             existingMember.Status = OrgMemberStatus.Invited;
             existingMember.Role = role;
             existingMember.InvitedAt = DateTime.UtcNow;
             existingMember.InvitedBy = currentUserId;
             existingMember.JoinedAt = null; 
             existingMember.UpdatedAt = DateTime.UtcNow;
             existingMember.UpdatedByUserId = currentUserId;
             
             await _context.SaveChangesAsync();

             return new OrganizationMemberDto
             {
                 Id = existingMember.Id,
                 UserId = existingMember.UserId,
                 Email = existingMember.Email,
                 Role = existingMember.Role.ToString(),
                 Status = existingMember.Status.ToString()
             };
        }

        // Create new organization member
        var newMember = new OrganizationMember
        {
            OrganizationId = organizationId,
            UserId = userToAdd.Id,
            Email = userToAdd.Email,
            Role = role,
            Status = OrgMemberStatus.Invited,
            InvitedAt = DateTime.UtcNow,
            InvitedBy = currentUserId
        };

        _context.OrganizationMembers.Add(newMember);
        await _context.SaveChangesAsync();

        return new OrganizationMemberDto
        {
            Id = newMember.Id,
            UserId = newMember.UserId,
            Email = newMember.Email,
            Role = newMember.Role.ToString(),
            Status = newMember.Status.ToString()
        };
    }

    public async Task<AcceptInvitationResultDto> AcceptInvitationAsync(int organizationId, int userId)
    {
        var invitation = await _context.OrganizationMembers
            .FirstOrDefaultAsync(m => m.OrganizationId == organizationId && 
                                     m.UserId == userId && 
                                     m.Status == OrgMemberStatus.Invited);

        if (invitation == null)
            throw new KeyNotFoundException("Pending invitation not found.");

        invitation.Status = OrgMemberStatus.Active;
        invitation.JoinedAt = DateTime.UtcNow;
        invitation.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return new AcceptInvitationResultDto
        {
            MemberId = invitation.Id,
            OrganizationId = invitation.OrganizationId,
            UserId = invitation.UserId,
            Email = invitation.Email,
            Role = invitation.Role,
            Status = invitation.Status,
            JoinedAt = invitation.JoinedAt
        };
    }

    public async Task<DeclineInvitationResultDto> DeclineInvitationAsync(int organizationId, int userId)
    {
        var invitation = await _context.OrganizationMembers
            .FirstOrDefaultAsync(m => m.OrganizationId == organizationId && 
                                     m.UserId == userId && 
                                     m.Status == OrgMemberStatus.Invited);

        if (invitation == null)
            throw new KeyNotFoundException("Pending invitation not found.");

        invitation.Status = OrgMemberStatus.Declined;
        invitation.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return new DeclineInvitationResultDto
        {
            MemberId = invitation.Id,
            OrganizationId = invitation.OrganizationId,
            UserId = invitation.UserId,
            Status = invitation.Status,
            DeclinedAt = DateTime.UtcNow
        };
    }

    public async Task<bool> RemoveMemberAsync(int organizationId, int memberId, int requestingUserId)
    {
        var memberToRemove = await _context.OrganizationMembers
            .FirstOrDefaultAsync(m => m.OrganizationId == organizationId && m.Id == memberId);

        if (memberToRemove == null)
            throw new KeyNotFoundException("Member not found in this organization.");

        var potentialRequester = await _context.OrganizationMembers
            .FirstOrDefaultAsync(m => m.OrganizationId == organizationId && m.UserId == requestingUserId);

        // If the requester is not in the organization, they can't remove anyone
        if (potentialRequester == null)
            throw new UnauthorizedAccessException("You are not a member of this organization.");

        bool isRemovingSelf = memberToRemove.UserId == requestingUserId;
        bool isAdmin = potentialRequester.Role == OrgMemberRole.Admin;

        if (!isRemovingSelf && !isAdmin)
            throw new UnauthorizedAccessException("Only organization admins can remove other members.");

        if (memberToRemove.Role == OrgMemberRole.Admin && memberToRemove.Status == OrgMemberStatus.Active)
        {
            var adminCount = await _context.OrganizationMembers
                .CountAsync(m => m.OrganizationId == organizationId && m.Role == OrgMemberRole.Admin && m.Status == OrgMemberStatus.Active);
            
            if (adminCount <= 1)
            {
                // This is the last admin
                 throw new InvalidOperationException("Cannot remove the last administrator of the organization.");
            }
        }

        // Soft delete: Change status to Removed
        memberToRemove.Status = OrgMemberStatus.Removed;
        memberToRemove.UpdatedAt = DateTime.UtcNow;
        memberToRemove.UpdatedByUserId = requestingUserId;

        // Remove from all teams (explicitly needed for soft delete)
        var teamMemberships = await _context.TeamMembers
            .Where(tm => tm.OrgMemberId == memberId)
            .ToListAsync();
        
        if (teamMemberships.Any())
        {
            _context.TeamMembers.RemoveRange(teamMemberships);
        }

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<IEnumerable<PendingInvitationDto>> GetPendingInvitationsAsync(int userId)
    {
        return await _context.OrganizationMembers
            .Where(m => m.UserId == userId && m.Status == OrgMemberStatus.Invited)
            .Include(m => m.Organization)
            .Select(m => new PendingInvitationDto
            {
                OrganizationId = m.Organization.Id,
                OrganizationName = m.Organization.Name,
                OrganizationSlug = m.Organization.Slug,
                Role = m.Role,
                InvitedAt = m.InvitedAt
            })
            .ToListAsync();
    }

    private string GenerateSlug(string phrase)
    {
        string str = phrase.ToLowerInvariant();
        str = Regex.Replace(str, @"[^a-z0-9\s-]", ""); 
        str = Regex.Replace(str, @"\s+", " ").Trim();
        str = Regex.Replace(str, @"\s", "-"); 
        return str;
    }
}