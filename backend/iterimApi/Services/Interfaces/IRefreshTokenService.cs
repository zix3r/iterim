using iterimApi.Models.Entities;

namespace iterimApi.Services.Interfaces;

public interface IRefreshTokenService
{
    Task<RefreshToken> GenerateRefreshToken(int userId);
    Task<RefreshToken?> ValidateRefreshToken(string token);
    Task RevokeRefreshToken(string token);
    Task RevokeAllUserTokens(int userId);
}