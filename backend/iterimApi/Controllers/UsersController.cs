using iterimApi.Data;
using iterimApi.DTOs;
using iterimApi.DTOs.Users;
using iterimApi.Models.Entities;
using iterimApi.Models.Settings;
using iterimApi.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using System.Security.Claims;
using System.Security.Cryptography;

namespace iterimApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UsersController : ControllerBase
{
    private static readonly HashSet<string> AllowedThemes = new(StringComparer.OrdinalIgnoreCase)
    {
        "light",
        "dark"
    };

    private readonly IRecentPageService _recentPageService;
    private readonly AppDbContext _context;
    private readonly IPasswordHasher<User> _passwordHasher;
    private readonly IEmailService _emailService;
    private readonly EmailSettings _emailSettings;

    public UsersController(
        IRecentPageService recentPageService,
        AppDbContext context,
        IPasswordHasher<User> passwordHasher,
        IEmailService emailService,
        IOptions<EmailSettings> emailSettings)
    {
        _recentPageService = recentPageService;
        _context = context;
        _passwordHasher = passwordHasher;
        _emailService = emailService;
        _emailSettings = emailSettings.Value;
    }

    private int GetProfileEmailChangeConfirmationExpiryMinutes()
    {
        if (_emailSettings.ProfileEmailChangeConfirmationExpiryMinutes < 1)
            return 1;

        return _emailSettings.ProfileEmailChangeConfirmationExpiryMinutes;
    }

    private static string GenerateSecureToken() =>
        Convert.ToBase64String(RandomNumberGenerator.GetBytes(64))
            .Replace("+", "-").Replace("/", "_").Replace("=", "");

    private async Task SendConfirmationEmailSafe(string toEmail, string toName, string confirmationToken)
    {
        try
        {
            await _emailService.SendEmailChangeConfirmationAsync(toEmail, toName, confirmationToken);
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"[EmailService] Failed to send confirmation email to {toEmail}: {ex.Message}");
        }
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

    private static string NormalizeTheme(string? theme)
    {
        if (string.IsNullOrWhiteSpace(theme)) return "light";
        return theme.Trim().ToLowerInvariant();
    }

    private static string GetSafeTheme(string? theme)
    {
        var normalized = NormalizeTheme(theme);
        return AllowedThemes.Contains(normalized) ? normalized : "light";
    }

    private static CurrentUserProfileDto MapCurrentUserProfile(User user) => new()
    {
        Name = user.Name,
        Email = user.Email,
        AvatarUrl = user.AvatarUrl,
        Theme = GetSafeTheme(user.Theme),
        CreatedAt = user.CreatedAt
    };

    [HttpGet("me")]
    public async Task<ActionResult<CurrentUserProfileDto>> GetCurrentUserProfile()
    {
        try
        {
            var user = await GetCurrentUserEntityAsync();
            if (user is null)
                return NotFound(new { errors = new[] { "User not found." } });

            return Ok(MapCurrentUserProfile(user));
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

            var normalizedName = dto.Name.Trim();
            var normalizedEmail = dto.Email.Trim().ToLowerInvariant();
            var shouldQueueEmailChange = !string.Equals(user.Email, normalizedEmail, StringComparison.OrdinalIgnoreCase);

            if (shouldQueueEmailChange)
            {
                var emailTaken = await _context.Users
                    .AnyAsync(u => u.Id != user.Id && (u.Email == normalizedEmail || u.PendingEmail == normalizedEmail));
                if (emailTaken)
                    return Conflict(new { errors = new[] { "Email is already in use." } });
            }

            if (!string.IsNullOrWhiteSpace(dto.Theme))
            {
                var theme = NormalizeTheme(dto.Theme);
                if (!AllowedThemes.Contains(theme))
                    return BadRequest(new { errors = new[] { "Theme must be one of: light, dark." } });
                user.Theme = theme;
            }

            user.Name = normalizedName;

            if (shouldQueueEmailChange)
            {
                user.PendingEmail = normalizedEmail;
                user.EmailConfirmationToken = GenerateSecureToken();
                user.EmailConfirmationTokenExpiry = DateTime.UtcNow.AddMinutes(GetProfileEmailChangeConfirmationExpiryMinutes());
            }

            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            if (shouldQueueEmailChange && user.EmailConfirmationToken is not null)
                _ = SendConfirmationEmailSafe(normalizedEmail, user.Name, user.EmailConfirmationToken);

            return Ok(MapCurrentUserProfile(user));
        }
        catch (UnauthorizedAccessException) { return Unauthorized(); }
    }

    [HttpPut("me/theme")]
    public async Task<ActionResult<CurrentUserProfileDto>> UpdateCurrentUserTheme([FromBody] UpdateThemeDto dto)
    {
        try
        {
            var user = await GetCurrentUserEntityAsync();
            if (user is null)
                return NotFound(new { errors = new[] { "User not found." } });

            var theme = NormalizeTheme(dto.Theme);
            if (!AllowedThemes.Contains(theme))
                return BadRequest(new { errors = new[] { "Theme must be one of: light, dark." } });

            user.Theme = theme;
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(MapCurrentUserProfile(user));
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

            return Ok(MapCurrentUserProfile(user));
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