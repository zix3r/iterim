using iterimApi.Data;
using iterimApi.DTOs;
using iterimApi.DTOs.Users;
using iterimApi.Models.Entities;
using iterimApi.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
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
    private readonly IPasswordHasher<User> _passwordHasher;

    public UsersController(
        IRecentPageService recentPageService,
        AppDbContext context,
        IPasswordHasher<User> passwordHasher)
    {
        _recentPageService = recentPageService;
        _context = context;
        _passwordHasher = passwordHasher;
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

    private async Task<User?> GetCurrentUserEntityAsync()
    {
        var userId = GetCurrentUserId();
        return await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
    }

    [HttpGet("me")]
    public async Task<ActionResult<CurrentUserProfileDto>> GetCurrentUserProfile()
    {
        try
        {
            var user = await GetCurrentUserEntityAsync();
            if (user is null)
                return NotFound(new { errors = new[] { "User not found." } });

            return Ok(new CurrentUserProfileDto
            {
                Name = user.Name,
                Email = user.Email,
                AvatarUrl = user.AvatarUrl,
                CreatedAt = user.CreatedAt
            });
        }
        catch (UnauthorizedAccessException) { return Unauthorized(); }
    }

    [HttpPut("me")]
    public async Task<ActionResult<CurrentUserProfileDto>> UpdateCurrentUserProfile([FromBody] UpdateProfileDto dto)
    {
        try
        {
            var user = await GetCurrentUserEntityAsync();
            if (user is null)
                return NotFound(new { errors = new[] { "User not found." } });

            var normalizedEmail = dto.Email.Trim().ToLowerInvariant();

            var emailTaken = await _context.Users
                .AnyAsync(u => u.Id != user.Id && u.Email == normalizedEmail);
            if (emailTaken)
                return Conflict(new { errors = new[] { "Email is already in use." } });

            user.Name = dto.Name.Trim();
            user.Email = normalizedEmail;
            user.UpdatedAt = DateTime.UtcNow;

            // Sync email to all org memberships
            var orgMemberships = await _context.OrganizationMembers
                .Where(om => om.UserId == user.Id)
                .ToListAsync();
            foreach (var om in orgMemberships)
                om.Email = normalizedEmail;

            await _context.SaveChangesAsync();

            return Ok(new CurrentUserProfileDto
            {
                Name = user.Name,
                Email = user.Email,
                AvatarUrl = user.AvatarUrl,
                CreatedAt = user.CreatedAt
            });
        }
        catch (UnauthorizedAccessException) { return Unauthorized(); }
    }

    [HttpPut("me/password")]
    public async Task<IActionResult> ChangeCurrentUserPassword([FromBody] ChangePasswordDto dto)
    {
        try
        {
            var user = await GetCurrentUserEntityAsync();
            if (user is null)
                return NotFound(new { errors = new[] { "User not found." } });

            var currentPasswordVerification = _passwordHasher.VerifyHashedPassword(
                user,
                user.PasswordHash,
                dto.OldPassword);

            if (currentPasswordVerification == PasswordVerificationResult.Failed)
                return BadRequest(new { errors = new[] { "Old password is incorrect." } });

            var isSameAsCurrentPassword = _passwordHasher.VerifyHashedPassword(
                user,
                user.PasswordHash,
                dto.NewPassword) != PasswordVerificationResult.Failed;

            if (isSameAsCurrentPassword)
                return BadRequest(new { errors = new[] { "New password must be different from old password." } });

            user.PasswordHash = _passwordHasher.HashPassword(user, dto.NewPassword);
            user.UpdatedAt = DateTime.UtcNow;
            user.FailedLoginAttempts = 0;
            user.LockoutEnd = null;

            await _context.SaveChangesAsync();
            return NoContent();
        }
        catch (UnauthorizedAccessException) { return Unauthorized(); }
    }

    [HttpPut("me/avatar")]
    public async Task<ActionResult<CurrentUserProfileDto>> UpdateCurrentUserAvatar([FromBody] UpdateAvatarDto dto)
    {
        try
        {
            var user = await GetCurrentUserEntityAsync();
            if (user is null)
                return NotFound(new { errors = new[] { "User not found." } });

            user.AvatarUrl = dto.AvatarUrl.Trim();
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new CurrentUserProfileDto
            {
                Name = user.Name,
                Email = user.Email,
                AvatarUrl = user.AvatarUrl,
                CreatedAt = user.CreatedAt
            });
        }
        catch (UnauthorizedAccessException) { return Unauthorized(); }
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