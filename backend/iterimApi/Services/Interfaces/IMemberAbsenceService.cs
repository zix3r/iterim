using iterimApi.DTOs.MemberAbsences;

namespace iterimApi.Services.Interfaces;

public interface IMemberAbsenceService
{
    Task<IEnumerable<MemberAbsenceDto>> GetAbsencesByDateRangeAsync(int orgId, DateOnly from, DateOnly to, int userId);
    Task<MemberAbsenceDto> CreateMemberAbsenceAsync(int orgId, CreateMemberAbsenceDto dto, int userId);
    Task<MemberAbsenceDto?> UpdateMemberAbsenceAsync(int id, UpdateMemberAbsenceDto dto, int userId);
    Task<bool> DeleteMemberAbsenceAsync(int id, int userId);
}
