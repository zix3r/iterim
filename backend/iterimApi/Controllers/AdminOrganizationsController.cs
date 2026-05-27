using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using iterimApi.DTOs.Admin;
using iterimApi.Services.Interfaces;
namespace iterimApi.Controllers;

[ApiController]
[Route("api/admin/organizations/manage")]
[Authorize] // Jei turite atskirą sistemos admino rolę, pridėkite: [Authorize(Roles = "SystemAdmin")]
public class AdminOrganizationsController : ControllerBase
{
    private readonly IAdminOrganizationService _adminOrgService;

    public AdminOrganizationsController(IAdminOrganizationService adminOrgService)
    {
        _adminOrgService = adminOrgService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<AdminOrganizationListDto>>> GetOrganizations()
    {
        var orgs = await _adminOrgService.GetOrganizationsAsync();
        return Ok(orgs);
    }

    [HttpGet("{orgId}/details")]
    public async Task<ActionResult<AdminOrganizationDetailDto>> GetOrganizationDetails(int orgId)
    {
        var org = await _adminOrgService.GetOrganizationDetailsAsync(orgId);
        if (org == null)
            return NotFound(new { message = "Organization not found" });

        return Ok(org);
    }

    [HttpDelete("{orgId}")]
    public async Task<IActionResult> DeleteOrganization(int orgId)
    {
        await _adminOrgService.DeleteOrganizationAsync(orgId);
        return NoContent(); // 204 No Content (sėkmingai ištrinta)
    }
}