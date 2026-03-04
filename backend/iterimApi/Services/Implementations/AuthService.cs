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
    private readonly JwtSettings _jwtSettings;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly IPasswordHasher<User> _passwordHasher;

    private const int MaxFailedAttempts = 5;
    private const int LockoutMinutes = 15;

    public AuthService(
        AppDbContext db,
        IJwtService jwtService,
        IRefreshTokenService refreshTokenService,
        IOptions<JwtSettings> jwtSettings,
        IHttpContextAccessor httpContextAccessor,
        IPasswordHasher<User> passwordHasher)
    {
        _db = db;
        _jwtService = jwtService;
        _refreshTokenService = refreshTokenService;
        _jwtSettings = jwtSettings.Value;
        _httpContextAccessor = httpContextAccessor;
        _passwordHasher = passwordHasher;
    }

    public async Task<(AuthResultDto Result, UserResponseDto? User)> RegisterAsync(RegisterRequestDto dto)
    {
        var emailExists = await _db.Users.AnyAsync(u => u.Email == dto.Email.ToLower());
        if (emailExists)
            return (AuthResultDto.Fail("Email is already in use."), null);

        var user = new User
        {
            Email = dto.Email.ToLower(),
            Name = dto.Name.Trim(),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        user.PasswordHash = _passwordHasher.HashPassword(user, dto.Password);

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        await IssueTokens(user);

        return (AuthResultDto.Ok(), MapToDto(user));
    }

    public async Task<(AuthResultDto Result, UserResponseDto? User)> LoginAsync(LoginRequestDto dto)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == dto.Email.ToLower());

        if (user is null)
            return (AuthResultDto.Fail("Invalid email or password."), null);

        // Lockout check
        if (user.LockoutEnd.HasValue && user.LockoutEnd > DateTime.UtcNow)
            return (AuthResultDto.Fail($"Account is locked. Try again after {user.LockoutEnd:HH:mm} UTC."), null);

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

        // Successful login — reset lockout
        user.FailedLoginAttempts = 0;
        user.LockoutEnd = null;
        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        await IssueTokens(user);

        return (AuthResultDto.Ok(), MapToDto(user));
    }

    public async Task<AuthResultDto> RefreshTokenAsync(string refreshToken)
    {
        var storedToken = await _refreshTokenService.ValidateRefreshToken(refreshToken);

        if (storedToken is null)
            return AuthResultDto.Fail("Invalid or expired refresh token.");

        var user = storedToken.User;

        // Rotate: revoke old, issue new
        await _refreshTokenService.RevokeRefreshToken(refreshToken);
        await IssueTokens(user);

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

    // ── Private helpers ──────────────────────────────────────

    private async Task IssueTokens(User user)
    {
        var response = _httpContextAccessor.HttpContext?.Response;
        if (response is null) return;

        var accessToken = _jwtService.GenerateAccessToken(user);
        var refreshToken = await _refreshTokenService.GenerateRefreshToken(user.Id);

        CookieHelper.SetAccessTokenCookie(response, accessToken, _jwtSettings.AccessTokenExpirationMinutes);
        CookieHelper.SetRefreshTokenCookie(response, refreshToken.Token, _jwtSettings.RefreshTokenExpirationDays);
    }

    private static UserResponseDto MapToDto(User user) => new()
    {
        Id = user.Id,
        Email = user.Email,
        Name = user.Name,
        AvatarUrl = null
    };
}
