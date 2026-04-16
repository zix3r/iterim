using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using iterimApi.DTOs.Iterations;
using iterimApi.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace iterimApi.Controllers;

[ApiController]
[Authorize]
public class IterationsController : ControllerBase
{
    private readonly IIterationService _iterationService;

    public IterationsController(IIterationService iterationService)
    {
        _iterationService = iterationService;
    }

    /// <summary>
    /// Get all iterations for a team, ordered by start date descending.
    /// GET /api/teams/:teamId/iterations
    /// </summary>
    [HttpGet("api/teams/{teamId}/iterations")]
    public async Task<IActionResult> GetIterationsByTeam(int teamId)
    {
        try
        {
            var userId = GetUserId();
            var iterations = await _iterationService.GetIterationsByTeamAsync(teamId, userId);
            return Ok(iterations);
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
            return StatusCode(500, new { message = "An error occurred while retrieving iterations", error = ex.Message });
        }
    }

    /// <summary>
    /// Get iteration details with WorkItem count and total points.
    /// GET /api/iterations/:id
    /// </summary>
    [HttpGet("api/iterations/{id}")]
    public async Task<IActionResult> GetIterationById(int id)
    {
        try
        {
            var userId = GetUserId();
            var iteration = await _iterationService.GetIterationByIdAsync(id, userId);

            if (iteration == null)
            {
                return NotFound(new { message = "Iteration not found" });
            }

            return Ok(iteration);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred while retrieving the iteration", error = ex.Message });
        }
    }

    /// <summary>
    /// Create a new iteration for a team.
    /// POST /api/teams/:teamId/iterations
    /// If StartDate/EndDate are omitted, defaults to today + OrganizationConfig.IterationLengthDays.
    /// </summary>
    [HttpPost("api/teams/{teamId}/iterations")]
    public async Task<IActionResult> CreateIteration(int teamId, [FromBody] CreateIterationDto dto)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        try
        {
            var userId = GetUserId();
            var iteration = await _iterationService.CreateIterationAsync(teamId, dto, userId);

            if (iteration == null)
            {
                return BadRequest(new { message = "Failed to create iteration" });
            }

            return CreatedAtAction(
                nameof(GetIterationById),
                new { id = iteration.Id },
                iteration
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
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred while creating the iteration", error = ex.Message });
        }
    }

    /// <summary>
    /// Update iteration details (name, dates, goal). Cannot edit completed iterations.
    /// PUT /api/iterations/:id
    /// </summary>
    [HttpPut("api/iterations/{id}")]
    public async Task<IActionResult> UpdateIteration(int id, [FromBody] UpdateIterationDto dto)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        try
        {
            var userId = GetUserId();
            var iteration = await _iterationService.UpdateIterationAsync(id, dto, userId);

            if (iteration == null)
            {
                return NotFound(new { message = "Iteration not found" });
            }

            return Ok(iteration);
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
            return StatusCode(500, new { message = "An error occurred while updating the iteration", error = ex.Message });
        }
    }

    /// <summary>
    /// Start an iteration (Planning → Active).
    /// Only one iteration can be Active per team at a time.
    /// PATCH /api/iterations/:id/start
    /// </summary>
    [HttpPatch("api/iterations/{id}/start")]
    public async Task<IActionResult> StartIteration(int id)
    {
        try
        {
            var userId = GetUserId();
            var iteration = await _iterationService.StartIterationAsync(id, userId);

            if (iteration == null)
            {
                return NotFound(new { message = "Iteration not found" });
            }

            return Ok(iteration);
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
            return StatusCode(500, new { message = "An error occurred while starting the iteration", error = ex.Message });
        }
    }

    /// <summary>
    /// Complete an iteration (Active → Completed).
    /// PATCH /api/iterations/:id/complete
    /// </summary>
    [HttpPatch("api/iterations/{id}/complete")]
    public async Task<IActionResult> CompleteIteration(int id, [FromBody] CompleteIterationRequestDto? dto = null)
    {
        try
        {
            var userId = GetUserId();
            var iteration = await _iterationService.CompleteIterationAsync(id, userId, dto?.MoveUnfinishedToIterationId);

            if (iteration == null)
            {
                return NotFound(new { message = "Iteration not found" });
            }

            return Ok(iteration);
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
            return StatusCode(500, new { message = "An error occurred while completing the iteration", error = ex.Message });
        }
    }

    /// <summary>
    /// Delete an iteration. Cannot delete active iterations.
    /// Work items in the iteration are moved back to backlog.
    /// DELETE /api/iterations/:id
    /// </summary>
    [HttpDelete("api/iterations/{id}")]
    public async Task<IActionResult> DeleteIteration(int id)
    {
        try
        {
            var userId = GetUserId();
            var result = await _iterationService.DeleteIterationAsync(id, userId);

            if (!result)
            {
                return NotFound(new { message = "Iteration not found" });
            }

            return Ok(new { message = "Iteration deleted successfully" });
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
            return StatusCode(500, new { message = "An error occurred while deleting the iteration", error = ex.Message });
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
