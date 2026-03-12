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

    // POST /api/organizations/:id/members
    [HttpPost("{id:int}/members")]
    public async Task<ActionResult<OrganizationMemberDto>> AddMemberToOrganization(int id, [FromBody] AddOrganizationMemberDto dto)
    {
        try
        {
            var member = await _organizationService.AddMemberToOrganizationAsync(id, dto, GetUserId());
            return Ok(member);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    // GET /api/organizations/invitations
    [HttpGet("invitations")]
    public async Task<ActionResult<IEnumerable<OrganizationDto>>> GetPendingInvitations()
    {
        var invitations = await _organizationService.GetPendingInvitationsAsync(GetUserId());
        return Ok(invitations);
    }

    // POST /api/organizations/:id/accept
    [HttpPost("{id:int}/accept")]
    public async Task<ActionResult<OrganizationMemberDto>> AcceptInvitation(int id)
    {
        try
        {
            var member = await _organizationService.AcceptInvitationAsync(id, GetUserId());
            return Ok(member);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
    }
}