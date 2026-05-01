using iterimApi.DTOs.Teams;

namespace iterimApi.Services.Interfaces;

public interface ITeamService
{
    Task<IEnumerable<TeamDto>> GetTeamsByProductAsync(int productId, int userId);
    Task<TeamDetailDto?> GetTeamByIdAsync(int teamId, int userId);
    Task<TeamDto?> CreateTeamAsync(int productId, CreateTeamDto dto, int userId);
    Task<TeamDto?> UpdateTeamAsync(int teamId, UpdateTeamDto dto, int userId);
    Task<TeamMemberDto?> AddTeamMemberAsync(int teamId, AddTeamMemberDto dto, int userId);
    Task<TeamMemberDto?> UpdateTeamMemberRoleAsync(int teamId, int memberUserId, UpdateTeamMemberRoleDto dto, int userId);
    Task<bool> RemoveTeamMemberAsync(int teamId, int userId, int memberUserId);
    Task<bool> DeleteTeamAsync(int teamId, int userId);
    Task UpdateMemberScheduleAsync(int teamId, int teamMemberId, UpdateTeamMemberScheduleDto dto, int userId);
}
