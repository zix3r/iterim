using iterimApi.Data;
using iterimApi.DTOs.MemberAbsences;
using iterimApi.Models.Entities;
using iterimApi.Models.Enums;
using iterimApi.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace iterimApi.Services.Implementations;

public class MemberAbsenceService : IMemberAbsenceService
{
    private readonly AppDbContext _db;

    public MemberAbsenceService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<IEnumerable<MemberAbsenceDto>> GetAbsencesByDateRangeAsync(int orgId, DateOnly from, DateOnly to, int userId)
    {
        if (to < from)
            throw new InvalidOperationException("To date must be greater than or equal to from date");

        await EnsureOrganizationAccess(orgId, userId);

        var absences = await _db.MemberAbsences
            .Where(a => a.OrgMember.OrganizationId == orgId)
            .Where(a => a.FromDate <= to && a.ToDate >= from)
            .Include(a => a.OrgMember)
                .ThenInclude(om => om.User)
            .OrderBy(a => a.FromDate)
            .ToListAsync();

        return absences.Select(MapToDto);
    }

    public async Task<MemberAbsenceDto> CreateMemberAbsenceAsync(int orgId, CreateMemberAbsenceDto dto, int userId)
    {
        if (dto.ToDate < dto.FromDate)
            throw new InvalidOperationException("To date must be greater than or equal to from date");

        await EnsureOrganizationAccess(orgId, userId);

        var member = await _db.OrganizationMembers
            .Include(m => m.User)
            .FirstOrDefaultAsync(m => m.Id == dto.OrgMemberId &&
                                      m.OrganizationId == orgId &&
                                      m.Status == OrgMemberStatus.Active);

        if (member == null)
            throw new KeyNotFoundException("Organization member not found or not active");

        ValidateReasonDetails(dto.Reason, dto.OtherReason);

        var absence = new MemberAbsence
        {
            OrgMemberId = dto.OrgMemberId,
            FromDate = dto.FromDate,
            ToDate = dto.ToDate,
            Reason = dto.Reason,
            ReasonDetails = NormalizeReasonDetails(dto.Reason, dto.OtherReason),
            CreatedBy = userId,
            UpdatedBy = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _db.MemberAbsences.Add(absence);
        await _db.SaveChangesAsync();

        absence.OrgMember = member;

        return MapToDto(absence);
    }

    public async Task<MemberAbsenceDto?> UpdateMemberAbsenceAsync(int id, UpdateMemberAbsenceDto dto, int userId)
    {
        if (dto.ToDate < dto.FromDate)
            throw new InvalidOperationException("To date must be greater than or equal to from date");

        var absence = await _db.MemberAbsences
            .Include(a => a.OrgMember)
                .ThenInclude(om => om.User)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (absence == null)
            return null;

        await EnsureOrganizationAccess(absence.OrgMember.OrganizationId, userId);

        var member = await _db.OrganizationMembers
            .Include(m => m.User)
            .FirstOrDefaultAsync(m => m.Id == dto.OrgMemberId &&
                                      m.OrganizationId == absence.OrgMember.OrganizationId &&
                                      m.Status == OrgMemberStatus.Active);

        if (member == null)
            throw new KeyNotFoundException("Organization member not found or not active");

        ValidateReasonDetails(dto.Reason, dto.OtherReason);

        absence.OrgMemberId = dto.OrgMemberId;
        absence.FromDate = dto.FromDate;
        absence.ToDate = dto.ToDate;
        absence.Reason = dto.Reason;
        absence.ReasonDetails = NormalizeReasonDetails(dto.Reason, dto.OtherReason);
        absence.UpdatedBy = userId;
        absence.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        absence.OrgMember = member;

        return MapToDto(absence);
    }

    public async Task<bool> DeleteMemberAbsenceAsync(int id, int userId)
    {
        var absence = await _db.MemberAbsences
            .Include(a => a.OrgMember)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (absence == null)
            return false;

        await EnsureOrganizationAccess(absence.OrgMember.OrganizationId, userId);

        _db.MemberAbsences.Remove(absence);
        await _db.SaveChangesAsync();

        return true;
    }

    private async Task EnsureOrganizationAccess(int orgId, int userId)
    {
        var isMember = await _db.OrganizationMembers
            .AnyAsync(m => m.OrganizationId == orgId &&
                           m.UserId == userId &&
                           m.Status == OrgMemberStatus.Active);

        if (!isMember)
            throw new UnauthorizedAccessException("User is not a member of this organization");
    }

    private static void ValidateReasonDetails(AbsenceReason reason, string? otherReason)
    {
        if (reason == AbsenceReason.Other && string.IsNullOrWhiteSpace(otherReason))
            throw new InvalidOperationException("Other reason text is required when reason is 'Other'");
    }

    private static string? NormalizeReasonDetails(AbsenceReason reason, string? otherReason)
    {
        if (reason != AbsenceReason.Other)
            return null;

        return otherReason?.Trim();
    }

    private static MemberAbsenceDto MapToDto(MemberAbsence absence)
    {
        return new MemberAbsenceDto
        {
            Id = absence.Id,
            OrgMemberId = absence.OrgMemberId,
            MemberName = absence.OrgMember.User.Name,
            FromDate = absence.FromDate,
            ToDate = absence.ToDate,
            Reason = absence.Reason == AbsenceReason.Other && !string.IsNullOrWhiteSpace(absence.ReasonDetails)
                ? absence.ReasonDetails
                : absence.Reason.ToString()
        };
    }
}
