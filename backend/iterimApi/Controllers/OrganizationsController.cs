using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using iterimApi.Models.DTOs.Organizations;
using iterimApi.Services.Interfaces;
using Microsoft.AspNetCore.Identity.Data;

namespace iterimApi.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class OrganizationsController : ControllerBase
{
    private readonly IOrganizationService _organizationService;

    public OrganizationsController(IOrganizationService organizationService)
    {
        _organizationService = organizationService;
    }

    // Pagalbinis metodas ištraukti ir konvertuoti vartotojo ID į INT
    private int GetUserId()
    {
        var claim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (int.TryParse(claim, out int userId))
        {
            return userId;
        }
        throw new UnauthorizedAccessException("Invalid User Token.");
    }

    // GET /api/organizations
    [HttpGet]
    public async Task<ActionResult<IEnumerable<OrganizationDto>>> GetMyOrganizations()
    {
        var organizations = await _organizationService.GetUserOrganizationsAsync(GetUserId());
        return Ok(organizations);
    }

    // POST /api/organizations
    [HttpPost]
    public async Task<ActionResult<OrganizationDto>> CreateOrganization([FromBody] CreateOrganizationDto dto)
    {
        var organization = await _organizationService.CreateOrganizationAsync(dto, GetUserId());
        return CreatedAtAction(nameof(GetOrganizationById), new { id = organization.Id }, organization);
    }

    // GET /api/organizations/:id
    [HttpGet("{id:int}")] // Pakeista iš guid į int
    public async Task<ActionResult<OrganizationDetailDto>> GetOrganizationById(int id)
    {
        try
        {
            var organization = await _organizationService.GetOrganizationByIdAsync(id, GetUserId());
            return Ok(organization);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid(); 
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message); // Grąžina 404
        }
    }
}