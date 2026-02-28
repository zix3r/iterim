using System.Security.Cryptography;
using iterimApi.Data;
using iterimApi.Models.Entities;
using iterimApi.Models.Settings;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace iterimApi.Services;

public class RefreshTokenService : IRefreshTokenService
{
    private readonly AppDbContext _db;
    private readonly JwtSettings _settings;

    public RefreshTokenService(AppDbContext db, IOptions<JwtSettings> settings)
    {
        _db = db;
        _settings = settings.Value;
    }

    public async Task<RefreshToken> GenerateRefreshToken(int userId)
    {
        var token = new RefreshToken
        {
            UserId = userId,
            Token = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64)),
            ExpiresAt = DateTime.UtcNow.AddDays(_settings.RefreshTokenExpirationDays),
            CreatedAt = DateTime.UtcNow
        };

        _db.RefreshTokens.Add(token);
        await _db.SaveChangesAsync();

        return token;
    }

    public async Task<RefreshToken?> ValidateRefreshToken(string token)
    {
        var refreshToken = await _db.RefreshTokens
            .Include(rt => rt.User)
            .FirstOrDefaultAsync(rt => rt.Token == token);

        if (refreshToken is null)
            return null;

        if (refreshToken.RevokedAt is not null)
            return null;

        if (refreshToken.ExpiresAt < DateTime.UtcNow)
            return null;

        return refreshToken;
    }

    public async Task RevokeRefreshToken(string token)
    {
        var refreshToken = await _db.RefreshTokens
            .FirstOrDefaultAsync(rt => rt.Token == token);

        if (refreshToken is not null)
        {
            refreshToken.RevokedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
        }
    }

    public async Task RevokeAllUserTokens(int userId)
    {
        var activeTokens = await _db.RefreshTokens
            .Where(rt => rt.UserId == userId && rt.RevokedAt == null)
            .ToListAsync();

        foreach (var token in activeTokens)
        {
            token.RevokedAt = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync();
    }
}