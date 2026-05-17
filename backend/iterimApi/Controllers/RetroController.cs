using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using iterimApi.DTOs.Retro;
using iterimApi.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace iterimApi.Controllers;

[ApiController]
[Authorize]
public class RetroController : ControllerBase
{
    private readonly IRetroService _retroService;

    public RetroController(IRetroService retroService)
    {
        _retroService = retroService;
    }

    /// <summary>
    /// Get the retrospective board for a single iteration. Allowed for all team
    /// members regardless of iteration status — this is how completed retros are
    /// re-read for reports.
    /// GET /api/teams/:teamId/iterations/:iterationId/retro
    /// </summary>
    [HttpGet("api/teams/{teamId}/iterations/{iterationId}/retro")]
    public async Task<IActionResult> GetRetroBoard(int teamId, int iterationId)
    {
        try
        {
            var board = await _retroService.GetRetroBoardAsync(teamId, iterationId, GetUserId());
            return Ok(board);
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
            return StatusCode(500, new { message = "An error occurred while retrieving the retrospective", error = ex.Message });
        }
    }

    /// <summary>
    /// Add a card to a column. Forbidden on Completed iterations.
    /// POST /api/teams/:teamId/iterations/:iterationId/retro
    /// </summary>
    [HttpPost("api/teams/{teamId}/iterations/{iterationId}/retro")]
    public async Task<IActionResult> CreateRetroItem(int teamId, int iterationId, [FromBody] CreateRetroItemDto dto)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        try
        {
            var item = await _retroService.CreateRetroItemAsync(teamId, iterationId, dto, GetUserId());
            return CreatedAtAction(nameof(GetRetroBoard), new { teamId, iterationId }, item);
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
            return StatusCode(500, new { message = "An error occurred while creating the retro card", error = ex.Message });
        }
    }

    /// <summary>
    /// Edit a card's content. Author-only. Forbidden on Completed iterations.
    /// PUT /api/teams/:teamId/iterations/:iterationId/retro/:itemId
    /// </summary>
    [HttpPut("api/teams/{teamId}/iterations/{iterationId}/retro/{itemId}")]
    public async Task<IActionResult> UpdateRetroItem(int teamId, int iterationId, int itemId, [FromBody] UpdateRetroItemDto dto)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        try
        {
            var item = await _retroService.UpdateRetroItemAsync(teamId, iterationId, itemId, dto, GetUserId());
            return Ok(item);
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
            return StatusCode(500, new { message = "An error occurred while updating the retro card", error = ex.Message });
        }
    }

    /// <summary>
    /// Delete a card. Author-only. Forbidden on Completed iterations.
    /// DELETE /api/teams/:teamId/iterations/:iterationId/retro/:itemId
    /// </summary>
    [HttpDelete("api/teams/{teamId}/iterations/{iterationId}/retro/{itemId}")]
    public async Task<IActionResult> DeleteRetroItem(int teamId, int iterationId, int itemId)
    {
        try
        {
            await _retroService.DeleteRetroItemAsync(teamId, iterationId, itemId, GetUserId());
            return NoContent();
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
            return StatusCode(500, new { message = "An error occurred while deleting the retro card", error = ex.Message });
        }
    }

    /// <summary>
    /// Toggle the caller's vote on a card (one vote per user per card).
    /// Returns the updated card so the FE can patch state without a refetch.
    /// POST /api/teams/:teamId/iterations/:iterationId/retro/:itemId/vote
    /// </summary>
    [HttpPost("api/teams/{teamId}/iterations/{iterationId}/retro/{itemId}/vote")]
    public async Task<IActionResult> ToggleVote(int teamId, int iterationId, int itemId)
    {
        try
        {
            var item = await _retroService.ToggleVoteAsync(teamId, iterationId, itemId, GetUserId());
            return Ok(item);
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
            return StatusCode(500, new { message = "An error occurred while voting", error = ex.Message });
        }
    }

    private int GetUserId()
    {
        var userIdClaim = User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
                         ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
            throw new UnauthorizedAccessException("Invalid user authentication");

        return userId;
    }
}
