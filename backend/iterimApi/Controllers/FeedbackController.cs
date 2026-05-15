using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using iterimApi.DTOs.Feedback;
using iterimApi.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace iterimApi.Controllers;

[ApiController]
[Authorize]
public class FeedbackController : ControllerBase
{
    private readonly IFeedbackService _feedback;

    public FeedbackController(IFeedbackService feedback)
    {
        _feedback = feedback;
    }

    /// <summary>POST /api/feedback — any authenticated user.</summary>
    [HttpPost("api/feedback")]
    public async Task<IActionResult> CreateFeedback([FromBody] CreateFeedbackDto dto)
    {
        try
        {
            var userId = GetUserId();
            var result = await _feedback.CreateAsync(userId, dto);
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Failed to create feedback", error = ex.Message });
        }
    }

    /// <summary>GET /api/admin/feedback — admin only, paginated + filterable.</summary>
    [HttpGet("api/admin/feedback")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] bool? reviewed = null,
        [FromQuery] bool? satisfied = null,
        [FromQuery] bool? bugs = null,
        [FromQuery] bool? wouldTryAgain = null)
    {
        var result = await _feedback.GetAllAsync(page, pageSize, reviewed, satisfied, bugs, wouldTryAgain);
        return Ok(result);
    }

    /// <summary>GET /api/admin/feedback/summary — admin only, aggregated stats for charts.</summary>
    [HttpGet("api/admin/feedback/summary")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetSummary()
    {
        var result = await _feedback.GetSummaryAsync();
        return Ok(result);
    }

    /// <summary>PATCH /api/admin/feedback/{id}/review — toggle reviewed status.</summary>
    [HttpPatch("api/admin/feedback/{id}/review")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> ToggleReviewed(int id)
    {
        try
        {
            var userId = GetUserId();
            var result = await _feedback.ToggleReviewedAsync(id, userId);
            if (result == null) return NotFound(new { message = "Feedback not found" });
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
    }

    private int GetUserId()
    {
        var idClaim = User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
                      ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrEmpty(idClaim) || !int.TryParse(idClaim, out var id))
            throw new UnauthorizedAccessException("Invalid user authentication");

        return id;
    }
}