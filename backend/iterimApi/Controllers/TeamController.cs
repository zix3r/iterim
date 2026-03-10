using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using iterimApi.DTOs.Teams;
using iterimApi.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace iterimApi.Controllers;

[ApiController]
[Authorize]
public class TeamsController : ControllerBase
{
    private readonly ITeamService _teamService;

    public TeamsController(ITeamService teamService)
    {
        _teamService = teamService;
    }

    /// <summary>
    /// Get all teams for a specific product
    /// </summary>
    [HttpGet("api/products/{productId}/teams")]
    public async Task<IActionResult> GetTeamsByProduct(int productId)
    {
        try
        {
            var userId = GetUserId();
            var teams = await _teamService.GetTeamsByProductAsync(productId, userId);
            return Ok(teams);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred while retrieving teams", error = ex.Message });
        }
    }

    /// <summary>
    /// Create a new team in a product
    /// </summary>
    [HttpPost("api/products/{productId}/teams")]
    public async Task<IActionResult> CreateTeam(int productId, [FromBody] CreateTeamDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            var userId = GetUserId();
            var team = await _teamService.CreateTeamAsync(productId, dto, userId);

            if (team == null)
            {
                return BadRequest(new { message = "Failed to create team" });
            }

            return CreatedAtAction(
                nameof(GetTeamById),
                new { id = team.Id },
                team
            );
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred while creating the team", error = ex.Message });
        }
    }

    /// <summary>
    /// Get team details with members by ID
    /// </summary>
    [HttpGet("api/teams/{id}")]
    public async Task<IActionResult> GetTeamById(int id)
    {
        try
        {
            var userId = GetUserId();
            var team = await _teamService.GetTeamByIdAsync(id, userId);

            if (team == null)
            {
                return NotFound(new { message = "Team not found" });
            }

            return Ok(team);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred while retrieving the team", error = ex.Message });
        }
    }

    /// <summary>
    /// Add a member to a team
    /// </summary>
    [HttpPost("api/teams/{id}/members")]
    public async Task<IActionResult> AddTeamMember(int id, [FromBody] AddTeamMemberDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            var userId = GetUserId();
            var teamMember = await _teamService.AddTeamMemberAsync(id, dto, userId);

            if (teamMember == null)
            {
                return BadRequest(new { message = "Failed to add team member" });
            }

            return Ok(teamMember);
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
            return StatusCode(500, new { message = "An error occurred while adding the team member", error = ex.Message });
        }
    }

    /// <summary>
    /// Remove a member from a team
    /// </summary>
    [HttpDelete("api/teams/{id}/members/{userId}")]
    public async Task<IActionResult> RemoveTeamMember(int id, int userId)
    {
        try
        {
            var requesterId = GetUserId();
            var result = await _teamService.RemoveTeamMemberAsync(id, requesterId, userId);

            if (!result)
            {
                return NotFound(new { message = "Team member not found" });
            }

            return Ok(new { message = "Team member removed successfully" });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred while removing the team member", error = ex.Message });
        }
    }

    /// <summary>
    /// Helper method to extract user ID from JWT claims
    /// </summary>
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
