using iterimApi.Models.DTOs.Organizations;

namespace iterimApi.Services.Interfaces;

public interface IOrganizationService
{
    Task<IEnumerable<OrganizationDto>> GetUserOrganizationsAsync(int userId);
    Task<OrganizationDetailDto> GetOrganizationByIdAsync(int id, int userId);
    Task<OrganizationDto> CreateOrganizationAsync(CreateOrganizationDto dto, int userId);
    Task<OrganizationMemberDto> AddMemberToOrganizationAsync(int organizationId, AddOrganizationMemberDto dto, int currentUserId);
    Task<OrganizationMemberDto> AcceptInvitationAsync(int organizationId, int userId);
    Task<IEnumerable<OrganizationDto>> GetPendingInvitationsAsync(int userId);
}