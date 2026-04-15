using iterimApi.DTOs.Auth;

namespace iterimApi.Services.Interfaces;

public interface IAuthService
{
    Task<(AuthResultDto Result, UserResponseDto? User)> RegisterAsync(RegisterRequestDto dto);
    Task<(AuthResultDto Result, UserResponseDto? User)> LoginAsync(LoginRequestDto dto);
    Task<AuthResultDto> RefreshTokenAsync(string refreshToken);
    Task LogoutAsync(string refreshToken);
    Task<UserResponseDto?> GetCurrentUserAsync(int userId);

    // ── Email confirmation ───────────────────────────────
    Task<AuthResultDto> ConfirmEmailAsync(string token);
    Task<AuthResultDto> ResendConfirmationAsync(string email);

    // ── Password reset ───────────────────────────────────
    Task<AuthResultDto> ForgotPasswordAsync(string email);
    Task<AuthResultDto> ResetPasswordAsync(ResetPasswordRequestDto dto);
}
