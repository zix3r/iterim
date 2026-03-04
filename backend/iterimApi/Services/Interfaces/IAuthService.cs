using iterimApi.DTOs.Auth;

namespace iterimApi.Services.Interfaces;

public interface IAuthService
{
    Task<(AuthResultDto Result, UserResponseDto? User)> RegisterAsync(RegisterRequestDto dto);
    Task<(AuthResultDto Result, UserResponseDto? User)> LoginAsync(LoginRequestDto dto);
    Task<AuthResultDto> RefreshTokenAsync(string refreshToken);
    Task LogoutAsync(string refreshToken);
    Task<UserResponseDto?> GetCurrentUserAsync(int userId);
}
