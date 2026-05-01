using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using iterimApi.Data;
using iterimApi.DTOs.Organizations;
using iterimApi.DTOs.MemberAbsences; // PRIDĖTA: kad matytų MemberAbsenceDto
using iterimApi.Services.Interfaces;
using iterimApi.Models.Entities;
using iterimApi.Models.Enums;

namespace iterimApi.Services.Implementations;

public class OrganizationService : IOrganizationService
{
    private readonly AppDbContext _db;
    private readonly IEmailService _emailService;
    private readonly ILogger<OrganizationService> _logger;

    public OrganizationService(
        AppDbContext db,
        IEmailService emailService,
        ILogger<OrganizationService> logger)
    {
        _db = db;
        _emailService = emailService;
        _logger = logger;
    }

    public async Task<IEnumerable<OrganizationDto>> GetUserOrganizationsAsync(int userId)
    {
        return await _db.Organizations
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
        var membership = await _db.OrganizationMembers
            .FirstOrDefaultAsync(om => om.OrganizationId == orgId && om.UserId == userId);

        if (membership == null)
            throw new KeyNotFoundException("Organization not found.");

        if (membership.Role != OrgMemberRole.Admin)
        {
            throw new UnauthorizedAccessException("Only Administrators can delete the organization.");
        }

        // 2. Surandame organizaciją
        var org = await _db.Organizations.FindAsync(orgId);
        if (org == null)
            throw new KeyNotFoundException("Organization not found.");

        // 3. Ištriname
        _db.Organizations.Remove(org);
        await _db.SaveChangesAsync();
    }

    public async Task<OrganizationDetailDto> GetOrganizationByIdAsync(int id, int userId)
    {
        var organization = await _db.Organizations
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

    // IT-110: Grąžinimo tipas Task<IEnumerable<MemberAbsenceDto>> privalo sutapti su interfeisu
    public async Task<IEnumerable<MemberAbsenceDto>> GetOrganizationAbsencesAsync(
        int orgId, string? memberName, DateOnly? from, DateOnly? to, AbsenceReason? type)
    {
        var query = _db.MemberAbsences
            .Include(a => a.OrgMember)
                .ThenInclude(m => m.User)
            .Where(a => a.OrgMember.OrganizationId == orgId);

        // Filtruojame pagal parametrus
        if (!string.IsNullOrWhiteSpace(memberName))
            query = query.Where(a => a.OrgMember.User.Name.Contains(memberName));

        if (from.HasValue)
            query = query.Where(a => a.ToDate >= from.Value);
            
        if (to.HasValue)
            query = query.Where(a => a.FromDate <= to.Value);

        if (type.HasValue)
            query = query.Where(a => a.Reason == type.Value);

        // 1. SVARBU: Pirmiausia parsisiunčiame duomenis iš DB, kad išvengtume SQL klaidos!
        var absencesList = await query.OrderByDescending(a => a.FromDate).ToListAsync();

        // 2. Dabar saugiai konvertuojame objektus (čia .ToString() veiks be problemų)
        return absencesList.Select(a => new MemberAbsenceDto 
        {
            Id = a.Id,
            OrgMemberId = a.OrgMemberId,
            MemberName = a.OrgMember.User.Name,
            FromDate = a.FromDate,
            ToDate = a.ToDate,
            Reason = a.Reason.ToString(),
            ReasonDetails = a.ReasonDetails
        });
    }

    public async Task<OrganizationDto> CreateOrganizationAsync(CreateOrganizationDto dto, int userId)
    {
        var user = await _db.Users.FindAsync(userId);
        if (user == null) throw new UnauthorizedAccessException("User not found.");

        var slug = GenerateSlug(dto.Name);

        if (await _db.Organizations.AnyAsync(o => o.Slug == slug))
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
                    Email = user.Email,
                    Role = OrgMemberRole.Admin,
                    Status = OrgMemberStatus.Active,
                    JoinedAt = DateTime.UtcNow
                }
            }
        };

        _db.Organizations.Add(organization);
        await _db.SaveChangesAsync();

        return new OrganizationDto
        {
            Id = organization.Id,
            Name = organization.Name,
            Slug = organization.Slug
        };
    }

    public async Task<OrganizationMemberDto> AddMemberToOrganizationAsync(int organizationId, AddOrganizationMemberDto dto, int currentUserId)
    {
        var organization = await _db.Organizations
            .Include(o => o.Members)
            .FirstOrDefaultAsync(o => o.Id == organizationId);

        if (organization == null)
            throw new KeyNotFoundException("Organization not found.");

        var currentUserMember = organization.Members.FirstOrDefault(m => m.UserId == currentUserId);
        if (currentUserMember == null || currentUserMember.Role != OrgMemberRole.Admin)
            throw new UnauthorizedAccessException("Only organization admins can add members.");

        var userToAdd = await _db.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);
        if (userToAdd == null)
            throw new KeyNotFoundException($"User with email '{dto.Email}' not found.");

        var existingMember = organization.Members.FirstOrDefault(m => m.UserId == userToAdd.Id);
        
        if (existingMember != null && 
           (existingMember.Status == OrgMemberStatus.Active || existingMember.Status == OrgMemberStatus.Invited))
        {
            throw new InvalidOperationException($"User '{dto.Email}' is already a member of this organization.");
        }

        if (!Enum.TryParse<OrgMemberRole>(dto.Role, true, out var role))
            throw new ArgumentException($"Invalid role: {dto.Role}. Valid roles are: Admin, Member, Viewer");

        // Inviter info reikalingas tiek išsaugojant DB, tiek formuojant el. laišką.
        var inviter = await _db.Users.FindAsync(currentUserId);
        var inviterName = !string.IsNullOrWhiteSpace(inviter?.Name)
            ? inviter!.Name
            : (inviter?.Email ?? "Iterim");

        if (existingMember != null)
        {
             existingMember.Status = OrgMemberStatus.Invited;
             existingMember.Role = role;
             existingMember.InvitedAt = DateTime.UtcNow;
             existingMember.InvitedBy = currentUserId;
             existingMember.JoinedAt = null;
             existingMember.UpdatedAt = DateTime.UtcNow;
             existingMember.UpdatedByUserId = currentUserId;

             await _db.SaveChangesAsync();

             await SendInvitationEmailSafeAsync(
                 userToAdd,
                 organization.Name,
                 inviterName,
                 existingMember.Role.ToString());

             return new OrganizationMemberDto
             {
                 Id = existingMember.Id,
                 UserId = existingMember.UserId,
                 Email = existingMember.Email,
                 Role = existingMember.Role.ToString(),
                 Status = existingMember.Status.ToString()
             };
        }

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

        _db.OrganizationMembers.Add(newMember);
        await _db.SaveChangesAsync();

        await SendInvitationEmailSafeAsync(
            userToAdd,
            organization.Name,
            inviterName,
            newMember.Role.ToString());

        return new OrganizationMemberDto
        {
            Id = newMember.Id,
            UserId = newMember.UserId,
            Email = newMember.Email,
            Role = newMember.Role.ToString(),
            Status = newMember.Status.ToString()
        };
    }

    // Saugus el. laiško siuntimas: nesugriaus pakvietimo, jei SMTP/Resend laikinai neveikia.
    private async Task SendInvitationEmailSafeAsync(User recipient, string organizationName, string inviterName, string role)
    {
        try
        {
            var displayName = !string.IsNullOrWhiteSpace(recipient.Name) ? recipient.Name : recipient.Email;
            await _emailService.SendOrganizationInvitationAsync(
                recipient.Email,
                displayName,
                organizationName,
                inviterName,
                role);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "Nepavyko išsiųsti pakvietimo laiško vartotojui {Email} į organizaciją {Organization}",
                recipient.Email,
                organizationName);
        }
    }

    public async Task<AcceptInvitationResultDto> AcceptInvitationAsync(int organizationId, int userId)
    {
        var invitation = await _db.OrganizationMembers
            .FirstOrDefaultAsync(m => m.OrganizationId == organizationId && 
                                      m.UserId == userId && 
                                      m.Status == OrgMemberStatus.Invited);

        if (invitation == null)
            throw new KeyNotFoundException("Pending invitation not found.");

        invitation.Status = OrgMemberStatus.Active;
        invitation.JoinedAt = DateTime.UtcNow;
        invitation.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

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
        var invitation = await _db.OrganizationMembers
            .FirstOrDefaultAsync(m => m.OrganizationId == organizationId && 
                                      m.UserId == userId && 
                                      m.Status == OrgMemberStatus.Invited);

        if (invitation == null)
            throw new KeyNotFoundException("Pending invitation not found.");

        invitation.Status = OrgMemberStatus.Declined;
        invitation.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

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
        var memberToRemove = await _db.OrganizationMembers
            .FirstOrDefaultAsync(m => m.OrganizationId == organizationId && m.Id == memberId);

        if (memberToRemove == null)
            throw new KeyNotFoundException("Member not found in this organization.");

        var potentialRequester = await _db.OrganizationMembers
            .FirstOrDefaultAsync(m => m.OrganizationId == organizationId && m.UserId == requestingUserId);

        if (potentialRequester == null)
            throw new UnauthorizedAccessException("You are not a member of this organization.");

        bool isRemovingSelf = memberToRemove.UserId == requestingUserId;
        bool isAdmin = potentialRequester.Role == OrgMemberRole.Admin;

        if (!isRemovingSelf && !isAdmin)
            throw new UnauthorizedAccessException("Only organization admins can remove other members.");

        if (memberToRemove.Role == OrgMemberRole.Admin && memberToRemove.Status == OrgMemberStatus.Active)
        {
            var adminCount = await _db.OrganizationMembers
                .CountAsync(m => m.OrganizationId == organizationId && m.Role == OrgMemberRole.Admin && m.Status == OrgMemberStatus.Active);
            
            if (adminCount <= 1)
            {
                 throw new InvalidOperationException("Cannot remove the last administrator of the organization.");
            }
        }

        memberToRemove.Status = OrgMemberStatus.Removed;
        memberToRemove.UpdatedAt = DateTime.UtcNow;
        memberToRemove.UpdatedByUserId = requestingUserId;

        var teamMemberships = await _db.TeamMembers
            .Where(tm => tm.OrgMemberId == memberId)
            .ToListAsync();
        
        if (teamMemberships.Any())
        {
            _db.TeamMembers.RemoveRange(teamMemberships);
        }

        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<OrganizationMemberDto> UpdateMemberRoleAsync(int organizationId, int memberId, string newRole, int requestingUserId)
    {
        // 1. Validate role string
        if (!Enum.TryParse<OrgMemberRole>(newRole, true, out var parsedRole))
            throw new ArgumentException($"Invalid role: {newRole}. Valid roles are: Admin, Member, Viewer");

        // 2. Locate the member to update
        var memberToUpdate = await _db.OrganizationMembers
            .FirstOrDefaultAsync(m => m.OrganizationId == organizationId && m.Id == memberId);

        if (memberToUpdate == null)
            throw new KeyNotFoundException("Member not found in this organization.");

        // 3. Verify the requester is an admin of this organization
        var requester = await _db.OrganizationMembers
            .FirstOrDefaultAsync(m => m.OrganizationId == organizationId && m.UserId == requestingUserId);

        if (requester == null)
            throw new UnauthorizedAccessException("You are not a member of this organization.");

        if (requester.Role != OrgMemberRole.Admin)
            throw new UnauthorizedAccessException("Only organization admins can change member roles.");

        // 4. Prevent admins from demoting themselves (use Leave Organization for that)
        if (memberToUpdate.UserId == requestingUserId)
            throw new InvalidOperationException("You cannot change your own role.");

        // 5. Don't allow role changes on removed/declined members
        if (memberToUpdate.Status == OrgMemberStatus.Removed || memberToUpdate.Status == OrgMemberStatus.Declined)
            throw new InvalidOperationException("Cannot change the role of a removed or declined member.");

        // 6. If demoting an active admin, ensure at least one admin remains
        if (memberToUpdate.Role == OrgMemberRole.Admin
            && parsedRole != OrgMemberRole.Admin
            && memberToUpdate.Status == OrgMemberStatus.Active)
        {
            var adminCount = await _db.OrganizationMembers
                .CountAsync(m => m.OrganizationId == organizationId
                                 && m.Role == OrgMemberRole.Admin
                                 && m.Status == OrgMemberStatus.Active);

            if (adminCount <= 1)
            {
                throw new InvalidOperationException("Cannot demote the last administrator of the organization.");
            }
        }

        // 7. No-op shortcut: nothing to do if role unchanged
        if (memberToUpdate.Role == parsedRole)
        {
            return new OrganizationMemberDto
            {
                Id = memberToUpdate.Id,
                UserId = memberToUpdate.UserId,
                Email = memberToUpdate.Email,
                Role = memberToUpdate.Role.ToString(),
                Status = memberToUpdate.Status.ToString()
            };
        }

        memberToUpdate.Role = parsedRole;
        memberToUpdate.UpdatedAt = DateTime.UtcNow;
        memberToUpdate.UpdatedByUserId = requestingUserId;

        await _db.SaveChangesAsync();

        return new OrganizationMemberDto
        {
            Id = memberToUpdate.Id,
            UserId = memberToUpdate.UserId,
            Email = memberToUpdate.Email,
            Role = memberToUpdate.Role.ToString(),
            Status = memberToUpdate.Status.ToString()
        };
    }

    // PATAISYTA: _context pakeistas į _db
    public async Task<IEnumerable<PendingInvitationDto>> GetPendingInvitationsAsync(int userId)
    {
        return await _db.OrganizationMembers
            .Where(m => m.UserId == userId && m.Status == OrgMemberStatus.Invited)
            .Include(m => m.Organization)
            .Select(m => new PendingInvitationDto
            {
                OrganizationId = m.Organization.Id,
                OrganizationName = m.Organization.Name,
                OrganizationSlug = m.Organization.Slug,
                Role = m.Role, // Pataisyta, kad grąžintų string
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