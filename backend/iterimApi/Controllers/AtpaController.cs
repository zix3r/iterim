using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using iterimApi.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace iterimApi.Controllers;

[ApiController]
[Authorize]
public class AtpaController : ControllerBase
{
    private readonly IAtpaService _atpa;

    public AtpaController(IAtpaService atpa)
    {
        _atpa = atpa;
    }

    /// <summary>
    /// Suggest assignments for unassigned work items in the iteration.
    /// POST /api/teams/:teamId/iterations/:iterationId/suggest-assignments
    /// Returns recommendations only — caller must confirm/reject each one.
    /// </summary>
    [HttpPost("api/teams/{teamId}/iterations/{iterationId}/suggest-assignments")]
    public async Task<IActionResult> SuggestAssignments(int teamId, int iterationId)
    {
        try
        {
            var userId = GetUserId();
            var result = await _atpa.SuggestAssignmentsAsync(iterationId, userId);

            if (result.TeamId != teamId)
            {
                return BadRequest(new { message = "Iteration does not belong to the given team" });
            }

            return Ok(result);
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
            return StatusCode(500, new { message = "An error occurred while suggesting assignments", error = ex.Message });
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
