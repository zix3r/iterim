using iterimApi.DTOs.Users;
using iterimApi.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace iterimApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly IRecentPageService _recentPageService;

    public UsersController(IRecentPageService recentPageService)
    {
        _recentPageService = recentPageService;
    }

    private int GetCurrentUserId()
    {
        var idClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (idClaim != null && int.TryParse(idClaim.Value, out var id))
        {
            return id;
        }
        throw new UnauthorizedAccessException("User not authenticated properly.");
    }

    [HttpGet("me/recent-pages")]
    public async Task<ActionResult<List<RecentPageDto>>> GetRecentPages()
    {
        try
        {
            var userId = GetCurrentUserId();
            var pages = await _recentPageService.GetRecentPagesAsync(userId);
            return Ok(pages);
        }
        catch (UnauthorizedAccessException) { return Unauthorized(); }
    }

    [HttpPut("me/recent-pages")]
    public async Task<IActionResult> AddRecentPage([FromBody] RecentPageDto dto)
    {
        try
        {
            var userId = GetCurrentUserId();
            await _recentPageService.AddRecentPageAsync(userId, dto);
            return NoContent();
        }
        catch (UnauthorizedAccessException) { return Unauthorized(); }
    }

    [HttpDelete("me/recent-pages")]
    public async Task<IActionResult> ClearRecentPages()
    {
        try
        {
            var userId = GetCurrentUserId();
            await _recentPageService.ClearRecentPagesAsync(userId);
            return NoContent();
        }
        catch (UnauthorizedAccessException) { return Unauthorized(); }
    }
}