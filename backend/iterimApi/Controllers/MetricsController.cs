using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using iterimApi.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace iterimApi.Controllers;

[ApiController]
[Authorize]
public class MetricsController : ControllerBase
{
    private readonly IMetricsService _metricsService;

    public MetricsController(IMetricsService metricsService)
    {
        _metricsService = metricsService;
    }

    /// <summary>
    /// Get velocity data for the last N completed sprints.
    /// GET /api/teams/:teamId/metrics/velocity?sprints=5
    /// </summary>
    [HttpGet("api/teams/{teamId}/metrics/velocity")]
    public async Task<IActionResult> GetVelocity(int teamId, [FromQuery] int sprints = 5)
    {
        if (sprints < 1 || sprints > 50)
            return BadRequest(new { message = "sprints must be between 1 and 50." });

        try
        {
            var userId   = GetUserId();
            var velocity = await _metricsService.GetVelocityAsync(teamId, userId, sprints);
            return Ok(velocity);
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
            return StatusCode(500, new { message = "An error occurred while retrieving velocity metrics.", error = ex.Message });
        }
    }

    /// <summary>
    /// Get sprint progress statistics and burndown data for a single iteration.
    /// GET /api/iterations/:id/metrics
    /// </summary>
    [HttpGet("api/iterations/{id}/metrics")]
    public async Task<IActionResult> GetSprintMetrics(int id)
    {
        try
        {
            var userId  = GetUserId();
            var metrics = await _metricsService.GetSprintMetricsAsync(id, userId);
            return Ok(metrics);
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
            return StatusCode(500, new { message = "An error occurred while retrieving sprint metrics.", error = ex.Message });
        }
    }

    /// <summary>
    /// Get team capacity with per-member absence breakdown for a date range.
    /// GET /api/teams/:teamId/metrics/capacity?from=2025-01-01&to=2025-01-14
    /// </summary>
    [HttpGet("api/teams/{teamId}/metrics/capacity")]
    public async Task<IActionResult> GetCapacity(
        int teamId,
        [FromQuery] DateOnly from,
        [FromQuery] DateOnly to)
    {
        if (from == default || to == default)
            return BadRequest(new { message = "Query parameters 'from' and 'to' are required (format: yyyy-MM-dd)." });

        if (from > to)
            return BadRequest(new { message = "'from' date must be before or equal to 'to' date." });

        try
        {
            var userId   = GetUserId();
            var capacity = await _metricsService.GetCapacityAsync(teamId, userId, from, to);
            return Ok(capacity);
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
            return StatusCode(500, new { message = "An error occurred while retrieving capacity metrics.", error = ex.Message });
        }
    }

    /// <summary>
    /// Helper method to extract user ID from JWT claims.
    /// </summary>
    private int GetUserId()
    {
        var userIdClaim = User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
                         ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
            throw new UnauthorizedAccessException("Invalid user authentication.");

        return userId;
    }
}
