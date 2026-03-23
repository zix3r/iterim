using iterimApi.DTOs.Organizations;

namespace iterimApi.Services.Interfaces;

public interface IOrganizationService
{
    Task<IEnumerable<OrganizationDto>> GetUserOrganizationsAsync(int userId);
    Task<OrganizationDetailDto> GetOrganizationByIdAsync(int id, int userId);
    Task<OrganizationDto> CreateOrganizationAsync(CreateOrganizationDto dto, int userId);
    Task<OrganizationMemberDto> AddMemberToOrganizationAsync(int organizationId, AddOrganizationMemberDto dto, int currentUserId);
    Task<AcceptInvitationResultDto> AcceptInvitationAsync(int organizationId, int userId);
    Task<DeclineInvitationResultDto> DeclineInvitationAsync(int organizationId, int userId);
    Task<bool> RemoveMemberAsync(int organizationId, int memberId, int requestingUserId);
    Task<IEnumerable<PendingInvitationDto>> GetPendingInvitationsAsync(int userId);
}