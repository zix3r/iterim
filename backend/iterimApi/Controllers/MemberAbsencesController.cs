using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using iterimApi.DTOs.MemberAbsences;
using iterimApi.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace iterimApi.Controllers;

[ApiController]
[Authorize]
public class MemberAbsencesController : ControllerBase
{
    private readonly IMemberAbsenceService _memberAbsenceService;

    public MemberAbsencesController(IMemberAbsenceService memberAbsenceService)
    {
        _memberAbsenceService = memberAbsenceService;
    }

    /// <summary>
    /// Get organization absences by date range.
    /// GET /api/organizations/:orgId/absences?from=&to=
    /// </summary>
    [HttpGet("api/organizations/{orgId}/absences")]
    public async Task<IActionResult> GetAbsencesByDateRange(int orgId, [FromQuery] DateOnly from, [FromQuery] DateOnly to)
    {
        try
        {
            var userId = GetUserId();
            var absences = await _memberAbsenceService.GetAbsencesByDateRangeAsync(orgId, from, to, userId);
            return Ok(absences);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred while retrieving absences", error = ex.Message });
        }
    }

    /// <summary>
    /// Create absence for organization member.
    /// POST /api/organizations/:orgId/absences
    /// </summary>
    [HttpPost("api/organizations/{orgId}/absences")]
    public async Task<IActionResult> CreateMemberAbsence(int orgId, [FromBody] CreateMemberAbsenceDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            var userId = GetUserId();
            var absence = await _memberAbsenceService.CreateMemberAbsenceAsync(orgId, dto, userId);
            return Ok(absence);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred while creating absence", error = ex.Message });
        }
    }

    /// <summary>
    /// Update absence by id.
    /// PUT /api/absences/:id
    /// </summary>
    [HttpPut("api/absences/{id}")]
    public async Task<IActionResult> UpdateMemberAbsence(int id, [FromBody] UpdateMemberAbsenceDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            var userId = GetUserId();
            var absence = await _memberAbsenceService.UpdateMemberAbsenceAsync(id, dto, userId);

            if (absence == null)
                return NotFound(new { message = "Absence not found" });

            return Ok(absence);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred while updating absence", error = ex.Message });
        }
    }

    /// <summary>
    /// Delete absence by id.
    /// DELETE /api/absences/:id
    /// </summary>
    [HttpDelete("api/absences/{id}")]
    public async Task<IActionResult> DeleteMemberAbsence(int id)
    {
        try
        {
            var userId = GetUserId();
            var deleted = await _memberAbsenceService.DeleteMemberAbsenceAsync(id, userId);

            if (!deleted)
                return NotFound(new { message = "Absence not found" });

            return Ok(new { message = "Absence deleted successfully" });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred while deleting absence", error = ex.Message });
        }
    }

    private int GetUserId()
    {
        var userIdClaim = User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
            ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
        {
            throw new UnauthorizedAccessException("Invalid user authentication");
        }

        return userId;
    }
}
