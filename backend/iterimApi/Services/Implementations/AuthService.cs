using System.Security.Cryptography;
using iterimApi.Data;
using iterimApi.DTOs.Auth;
using iterimApi.Helpers;
using iterimApi.Models.Entities;
using iterimApi.Models.Settings;
using iterimApi.Services.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace iterimApi.Services.Implementations;

public class AuthService : IAuthService
{
    private readonly AppDbContext _db;
    private readonly IJwtService _jwtService;
    private readonly IRefreshTokenService _refreshTokenService;
    private readonly IEmailService _emailService;
    private readonly JwtSettings _jwtSettings;
    private readonly EmailSettings _emailSettings;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly IPasswordHasher<User> _passwordHasher;

    private const int MaxFailedAttempts = 5;
    private const int LockoutMinutes = 15;
    private const int PasswordResetExpiryHours = 1;

    public AuthService(
        AppDbContext db,
        IJwtService jwtService,
        IRefreshTokenService refreshTokenService,
        IEmailService emailService,
        IOptions<JwtSettings> jwtSettings,
        IOptions<EmailSettings> emailSettings,
        IHttpContextAccessor httpContextAccessor,
        IPasswordHasher<User> passwordHasher)
    {
        _db = db;
        _jwtService = jwtService;
        _refreshTokenService = refreshTokenService;
        _emailService = emailService;
        _jwtSettings = jwtSettings.Value;
        _emailSettings = emailSettings.Value;
        _httpContextAccessor = httpContextAccessor;
        _passwordHasher = passwordHasher;
    }

    private int GetEmailConfirmationExpiryMinutes()
    {
        if (_emailSettings.EmailConfirmationExpiryMinutes < 1)
            return 1;

        return _emailSettings.EmailConfirmationExpiryMinutes;
    }

    // ── Register ─────────────────────────────────────────────

    public async Task<(AuthResultDto Result, UserResponseDto? User)> RegisterAsync(RegisterRequestDto dto)
    {
        var emailExists = await _db.Users.AnyAsync(u => u.Email == dto.Email.ToLower());
        if (emailExists)
            return (AuthResultDto.Fail("Email is already in use."), null);

        var confirmationToken = GenerateSecureToken();

        var user = new User
        {
            Email = dto.Email.ToLower(),
            Name = dto.Name.Trim(),
            IsEmailConfirmed = false,
            EmailConfirmationToken = confirmationToken,
            EmailConfirmationTokenExpiry = DateTime.UtcNow.AddMinutes(GetEmailConfirmationExpiryMinutes()),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        user.PasswordHash = _passwordHasher.HashPassword(user, dto.Password);

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        // Fire-and-forget: el. laiško siuntimo klaida nesustabdo registracijos
        _ = SendConfirmationEmailSafe(user, user.Email);

        return (AuthResultDto.Ok(), MapToDto(user));
    }

    // ── Login ─────────────────────────────────────────────────

    public async Task<(AuthResultDto Result, UserResponseDto? User)> LoginAsync(LoginRequestDto dto)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == dto.Email.ToLower());

        if (user is null)
            return (AuthResultDto.Fail("Invalid email or password."), null);

        // Lockout check
        if (user.LockoutEnd.HasValue && user.LockoutEnd > DateTime.UtcNow)
            return (AuthResultDto.Fail($"Account is locked. Try again after {user.LockoutEnd:HH:mm} UTC."), null);

        if (user.IsBlocked)
            return (AuthResultDto.Fail("Your account has been blocked. Contact an administrator."), null);

        var verificationResult = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, dto.Password);

        if (verificationResult == PasswordVerificationResult.Failed)
        {
            user.FailedLoginAttempts++;
            if (user.FailedLoginAttempts >= MaxFailedAttempts)
            {
                user.LockoutEnd = DateTime.UtcNow.AddMinutes(LockoutMinutes);
                user.FailedLoginAttempts = 0;
            }
            await _db.SaveChangesAsync();
            return (AuthResultDto.Fail("Invalid email or password."), null);
        }

        // ── Email confirmation check ──────────────────────
        if (!user.IsEmailConfirmed)
            return (AuthResultDto.Fail("Please confirm your email address before logging in."), null);

        // Successful login — reset lockout
        user.FailedLoginAttempts = 0;
        user.LockoutEnd = null;
        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        await IssueTokens(user);
        return (AuthResultDto.Ok(), MapToDto(user));
    }

    // ── Refresh / Logout / Me ─────────────────────────────────

    public async Task<AuthResultDto> RefreshTokenAsync(string refreshToken)
    {
        var storedToken = await _refreshTokenService.ValidateRefreshToken(refreshToken);
        if (storedToken is null)
            return AuthResultDto.Fail("Invalid or expired refresh token.");

        await _refreshTokenService.RevokeRefreshToken(refreshToken);
        await IssueTokens(storedToken.User);
        return AuthResultDto.Ok();
    }

    public async Task LogoutAsync(string refreshToken)
    {
        await _refreshTokenService.RevokeRefreshToken(refreshToken);
        var response = _httpContextAccessor.HttpContext?.Response;
        if (response is not null)
            CookieHelper.ClearAuthCookies(response);
    }

    public async Task<UserResponseDto?> GetCurrentUserAsync(int userId)
    {
        var user = await _db.Users.FindAsync(userId);
        return user is null ? null : MapToDto(user);
    }

    // ── Email confirmation ────────────────────────────────────

    public async Task<AuthResultDto> ConfirmEmailAsync(string token)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u =>
            u.EmailConfirmationToken == token);

        if (user is null)
            return AuthResultDto.Fail("Invalid confirmation token.");

        if (user.EmailConfirmationTokenExpiry < DateTime.UtcNow)
            return AuthResultDto.Fail("Confirmation token has expired. Please request a new one.");

        if (!string.IsNullOrWhiteSpace(user.PendingEmail))
        {
            var normalizedPendingEmail = user.PendingEmail.Trim().ToLowerInvariant();
            var emailTaken = await _db.Users
                .AnyAsync(u => u.Id != user.Id && u.Email == normalizedPendingEmail);

            if (emailTaken)
                return AuthResultDto.Fail("Email is already in use.");

            user.Email = normalizedPendingEmail;
            user.PendingEmail = null;
            user.EmailConfirmationToken = null;
            user.EmailConfirmationTokenExpiry = null;
            user.UpdatedAt = DateTime.UtcNow;

            var orgMemberships = await _db.OrganizationMembers
                .Where(om => om.UserId == user.Id)
                .ToListAsync();
            foreach (var om in orgMemberships)
                om.Email = normalizedPendingEmail;

            await _db.SaveChangesAsync();
            return AuthResultDto.Ok();
        }

        if (user.IsEmailConfirmed)
            return AuthResultDto.Ok(); // Idempotent — jau patvirtinta

        user.IsEmailConfirmed = true;
        user.EmailConfirmationToken = null;
        user.EmailConfirmationTokenExpiry = null;
        user.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return AuthResultDto.Ok();
    }

    public async Task<AuthResultDto> ResendConfirmationAsync(string email)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == email.ToLower());

        // Visada grąžiname Ok — neskleidžiame, ar vartotojas egzistuoja
        if (user is null || (user.IsEmailConfirmed && string.IsNullOrWhiteSpace(user.PendingEmail)))
            return AuthResultDto.Ok();

        user.EmailConfirmationToken = GenerateSecureToken();
        user.EmailConfirmationTokenExpiry = DateTime.UtcNow.AddMinutes(GetEmailConfirmationExpiryMinutes());
        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        _ = SendConfirmationEmailSafe(user, user.PendingEmail ?? user.Email);
        return AuthResultDto.Ok();
    }

    // ── Password reset ────────────────────────────────────────

    public async Task<AuthResultDto> ForgotPasswordAsync(string email)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == email.ToLower());

        // Visada grąžiname Ok — neskleidžiame, ar el. paštas egzistuoja
        if (user is null)
            return AuthResultDto.Ok();

        user.PasswordResetToken = GenerateSecureToken();
        user.PasswordResetTokenExpiry = DateTime.UtcNow.AddHours(PasswordResetExpiryHours);
        user.PasswordResetTokenUsed = false;
        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        _ = SendPasswordResetEmailSafe(user);
        return AuthResultDto.Ok();
    }

    public async Task<AuthResultDto> ResetPasswordAsync(ResetPasswordRequestDto dto)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u =>
            u.PasswordResetToken == dto.Token);

        if (user is null)
            return AuthResultDto.Fail("Invalid or expired password reset token.");

        if (user.PasswordResetTokenUsed)
            return AuthResultDto.Fail("This reset link has already been used.");

        if (user.PasswordResetTokenExpiry < DateTime.UtcNow)
            return AuthResultDto.Fail("Password reset token has expired. Please request a new one.");

        // Atnaujinti slaptažodį
        user.PasswordHash = _passwordHasher.HashPassword(user, dto.NewPassword);

        // Invaliduoti token
        user.PasswordResetToken = null;
        user.PasswordResetTokenExpiry = null;
        user.PasswordResetTokenUsed = true;

        // Išvalyti lockout
        user.FailedLoginAttempts = 0;
        user.LockoutEnd = null;

        user.UpdatedAt = DateTime.UtcNow;

        // Invaliduoti visus refresh tokens (force logout iš visų device'ų)
        var refreshTokens = await _db.RefreshTokens
            .Where(rt => rt.UserId == user.Id && rt.RevokedAt == null)
            .ToListAsync();
        foreach (var rt in refreshTokens)
            rt.RevokedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return AuthResultDto.Ok();
    }

    // ── Private helpers ───────────────────────────────────────

    private async Task IssueTokens(User user)
    {
        var response = _httpContextAccessor.HttpContext?.Response;
        if (response is null) return;

        var accessToken = _jwtService.GenerateAccessToken(user);
        var refreshToken = await _refreshTokenService.GenerateRefreshToken(user.Id);

        CookieHelper.SetAccessTokenCookie(response, accessToken, _jwtSettings.AccessTokenExpirationMinutes);
        CookieHelper.SetRefreshTokenCookie(response, refreshToken.Token, _jwtSettings.RefreshTokenExpirationDays);
    }

    private async Task SendConfirmationEmailSafe(User user, string targetEmail)
    {
        try
        {
            if (!string.IsNullOrWhiteSpace(user.PendingEmail) &&
                string.Equals(targetEmail, user.PendingEmail, StringComparison.OrdinalIgnoreCase))
            {
                await _emailService.SendEmailChangeConfirmationAsync(
                    targetEmail, user.Name, user.EmailConfirmationToken!);
            }
            else
            {
                await _emailService.SendEmailConfirmationAsync(
                    targetEmail, user.Name, user.EmailConfirmationToken!);
            }
        }
        catch (Exception ex)
        {
            // Loginti, bet neįkrėsti registracijos srauto
            Console.Error.WriteLine($"[EmailService] Failed to send confirmation email to {targetEmail}: {ex.Message}");
        }
    }

    private async Task SendPasswordResetEmailSafe(User user)
    {
        try
        {
            await _emailService.SendPasswordResetAsync(
                user.Email, user.Name, user.PasswordResetToken!);
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"[EmailService] Failed to send password reset email to {user.Email}: {ex.Message}");
        }
    }

    private static string GenerateSecureToken() =>
        Convert.ToBase64String(RandomNumberGenerator.GetBytes(64))
            .Replace("+", "-").Replace("/", "_").Replace("=", ""); // URL-safe

    private static string GetSafeTheme(string? theme)
    {
        if (string.Equals(theme, "dark", StringComparison.OrdinalIgnoreCase)) return "dark";
        return "light";
    }

    private static UserResponseDto MapToDto(User user) => new()
    {
        Id = user.Id,
        Email = user.Email,
        Name = user.Name,
        AvatarUrl = user.AvatarUrl,
        Role = user.Role.ToString(),
        Theme = GetSafeTheme(user.Theme)
    };
}
