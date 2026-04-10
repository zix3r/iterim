using iterimApi.Data;
using iterimApi.DTOs;
using iterimApi.DTOs.Users;
using iterimApi.Models.Entities;
using iterimApi.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace iterimApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly IRecentPageService _recentPageService;
    private readonly AppDbContext _context;

    public UsersController(IRecentPageService recentPageService, AppDbContext context)
    {
        _recentPageService = recentPageService;
        _context = context;
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

    [HttpGet("me/pinned-teams")]
    public async Task<ActionResult<IEnumerable<PinnedTeamDto>>> GetPinnedTeams()
    {
        try
        {
            var userId = GetCurrentUserId();
            var pinnedTeams = await _context.PinnedTeams
                .Include(pt => pt.Team)
                .ThenInclude(t => t.Product)
                .Where(pt => pt.UserId == userId)
                .OrderByDescending(pt => pt.PinnedAt)
                .Select(pt => new PinnedTeamDto
                {
                    TeamId = pt.Team.Id,
                    TeamName = pt.Team.Name,
                    OrgId = pt.Team.Product.OrganizationId,
                    ProductId = pt.Team.ProductId,
                    Path = $"/org/{pt.Team.Product.OrganizationId}/products/{pt.Team.ProductId}/teams/{pt.Team.Id}/backlog"
                })
                .ToListAsync();

            return Ok(pinnedTeams);
        }
        catch (UnauthorizedAccessException) { return Unauthorized(); }
    }

    [HttpPost("me/pinned-teams/{teamId}")]
    public async Task<IActionResult> PinTeam(int teamId)
    {
        try
        {
            var userId = GetCurrentUserId();

            var teamExists = await _context.Teams.AnyAsync(t => t.Id == teamId);
            if (!teamExists) return NotFound(new { errors = new[] { "Team not found." } });

            var alreadyPinned = await _context.PinnedTeams.AnyAsync(pt => pt.UserId == userId && pt.TeamId == teamId);
            if (alreadyPinned) return Ok();

            var existingPinsCount = await _context.PinnedTeams.CountAsync(pt => pt.UserId == userId);
            if (existingPinsCount >= 6)
            {
                return BadRequest(new { errors = new[] { "Maximum of 6 pinned teams allowed." } });
            }

            var pinnedTeam = new PinnedTeam
            {
                UserId = userId,
                TeamId = teamId,
                PinnedAt = DateTime.UtcNow
            };

            _context.PinnedTeams.Add(pinnedTeam);
            await _context.SaveChangesAsync();

            return Ok();
        }
        catch (UnauthorizedAccessException) { return Unauthorized(); }
    }

    [HttpDelete("me/pinned-teams/{teamId}")]
    public async Task<IActionResult> UnpinTeam(int teamId)
    {
        try
        {
            var userId = GetCurrentUserId();

            var pinnedTeam = await _context.PinnedTeams.FirstOrDefaultAsync(pt => pt.UserId == userId && pt.TeamId == teamId);
            
            if (pinnedTeam != null)
            {
                _context.PinnedTeams.Remove(pinnedTeam);
                await _context.SaveChangesAsync();
            }

            return Ok();
        }
        catch (UnauthorizedAccessException) { return Unauthorized(); }
    }
}