using iterimApi.DTOs.Admin;

namespace iterimApi.Services.Interfaces;

public interface IAdminOrganizationService
{
    Task<IEnumerable<AdminOrganizationListDto>> GetOrganizationsAsync();
    Task<AdminOrganizationDetailDto?> GetOrganizationDetailsAsync(int orgId);
    Task DeleteOrganizationAsync(int orgId);
}