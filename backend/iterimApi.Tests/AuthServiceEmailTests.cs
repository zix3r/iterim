// ── NuGet priklausomybės testų projektui ─────────────────────────
// dotnet add package Microsoft.EntityFrameworkCore.InMemory
// dotnet add package Moq
// dotnet add package xunit
// dotnet add package Microsoft.AspNetCore.Identity (jei dar neturite)

using System;
using System.Threading.Tasks;
using iterimApi.Data;
using iterimApi.DTOs.Auth;
using iterimApi.Helpers;
using iterimApi.Models.Entities;
using iterimApi.Models.Settings;
using iterimApi.Services.Implementations;
using iterimApi.Services.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace iterimApi.Tests;

public class AuthServiceEmailTests
{
    // ── Test fixtures ─────────────────────────────────────────

    private static AppDbContext CreateDb()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }

    private static AuthService CreateService(
        AppDbContext db,
        IEmailService? emailService = null,
        IHttpContextAccessor? httpContextAccessor = null)
    {
        var jwtService = new Mock<IJwtService>();
        jwtService.Setup(j => j.GenerateAccessToken(It.IsAny<User>())).Returns("access_token");

        var refreshToken = new RefreshToken { Token = "refresh_token", UserId = 0 };
        var refreshTokenService = new Mock<IRefreshTokenService>();
        refreshTokenService
            .Setup(r => r.GenerateRefreshToken(It.IsAny<int>()))
            .ReturnsAsync(refreshToken);
        refreshTokenService
            .Setup(r => r.ValidateRefreshToken(It.IsAny<string>()))
            .ReturnsAsync((RefreshToken?)null);

        var jwtSettings = Options.Create(new JwtSettings
        {
            AccessTokenExpirationMinutes = 15,
            RefreshTokenExpirationDays = 7
        });

        // Mock HttpContext su Response
        var httpContext = new DefaultHttpContext();
        var accessor = httpContextAccessor ?? new Mock<IHttpContextAccessor>().Object;
        if (httpContextAccessor is null)
        {
            var mockAccessor = new Mock<IHttpContextAccessor>();
            mockAccessor.Setup(a => a.HttpContext).Returns(httpContext);
            accessor = mockAccessor.Object;
        }

        var passwordHasher = new PasswordHasher<User>();
        var mockEmail = emailService ?? new Mock<IEmailService>().Object;

        var emailSettings = Options.Create(new EmailSettings { FromAddress = "test@example.com", FromName = "Test" });
        return new AuthService(db, jwtService.Object, refreshTokenService.Object,
            mockEmail, jwtSettings, emailSettings, accessor, passwordHasher);
    }

    private static async Task<User> CreateConfirmedUser(AppDbContext db, string email = "test@example.com")
    {
        var hasher = new PasswordHasher<User>();
        var user = new User
        {
            Email = email,
            Name = "Test User",
            IsEmailConfirmed = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        user.PasswordHash = hasher.HashPassword(user, "Password123!");
        db.Users.Add(user);
        await db.SaveChangesAsync();
        return user;
    }

    // ════════════════════════════════════════════════════════════
    //  Registracija → el. laiškas išsiųstas
    // ════════════════════════════════════════════════════════════

    [Fact]
    public async Task Register_SendsConfirmationEmail()
    {
        var db = CreateDb();
        var emailMock = new Mock<IEmailService>();
        var svc = CreateService(db, emailMock.Object);

        var dto = new RegisterRequestDto
        {
            Email = "new@example.com",
            Password = "Password123!",
            Name = "Jonas"
        };

        var (result, _) = await svc.RegisterAsync(dto);

        Assert.True(result.Success);

        // Nedelsiant patikrinti — fire-and-forget gali vėluoti, todėl palaukiame
        await Task.Delay(100);
        emailMock.Verify(e => e.SendEmailConfirmationAsync(
            "new@example.com", "Jonas", It.IsAny<string>()), Times.Once);
    }

    [Fact]
    public async Task Register_StoresConfirmationTokenInDb()
    {
        var db = CreateDb();
        var svc = CreateService(db);

        await svc.RegisterAsync(new RegisterRequestDto
        {
            Email = "token@example.com", Password = "Password123!", Name = "Test"
        });

        var user = await db.Users.FirstAsync(u => u.Email == "token@example.com");
        Assert.False(user.IsEmailConfirmed);
        Assert.NotNull(user.EmailConfirmationToken);
        Assert.NotNull(user.EmailConfirmationTokenExpiry);
        Assert.True(user.EmailConfirmationTokenExpiry > DateTime.UtcNow);
    }

    // ════════════════════════════════════════════════════════════
    //  Email confirmation — teisinga / neteisinga / pasibaigusi
    // ════════════════════════════════════════════════════════════

    [Fact]
    public async Task ConfirmEmail_WithValidToken_Succeeds()
    {
        var db = CreateDb();
        var svc = CreateService(db);

        var user = new User
        {
            Email = "confirm@example.com", Name = "Test",
            IsEmailConfirmed = false,
            EmailConfirmationToken = "valid-token",
            EmailConfirmationTokenExpiry = DateTime.UtcNow.AddHours(24),
            CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow
        };
        user.PasswordHash = new PasswordHasher<User>().HashPassword(user, "pw");
        db.Users.Add(user);
        await db.SaveChangesAsync();

        var result = await svc.ConfirmEmailAsync("valid-token");

        Assert.True(result.Success);
        var updated = await db.Users.FindAsync(user.Id);
        Assert.True(updated!.IsEmailConfirmed);
        Assert.Null(updated.EmailConfirmationToken);
    }

    [Fact]
    public async Task ConfirmEmail_WithInvalidToken_Fails()
    {
        var db = CreateDb();
        var svc = CreateService(db);

        var result = await svc.ConfirmEmailAsync("nonexistent-token");

        Assert.False(result.Success);
        Assert.Contains(result.Errors, e => e.Contains("Invalid"));
    }

    [Fact]
    public async Task ConfirmEmail_WithExpiredToken_Fails()
    {
        var db = CreateDb();
        var svc = CreateService(db);

        var user = new User
        {
            Email = "expired@example.com", Name = "Test",
            IsEmailConfirmed = false,
            EmailConfirmationToken = "expired-token",
            EmailConfirmationTokenExpiry = DateTime.UtcNow.AddHours(-1), // Pasibaigęs
            CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow
        };
        user.PasswordHash = new PasswordHasher<User>().HashPassword(user, "pw");
        db.Users.Add(user);
        await db.SaveChangesAsync();

        var result = await svc.ConfirmEmailAsync("expired-token");

        Assert.False(result.Success);
        Assert.Contains(result.Errors, e => e.Contains("expired"));
    }

    // ════════════════════════════════════════════════════════════
    //  Login be patvirtinimo → 403-lygi klaida
    // ════════════════════════════════════════════════════════════

    [Fact]
    public async Task Login_WithUnconfirmedEmail_ReturnsEmailConfirmationError()
    {
        var db = CreateDb();
        var svc = CreateService(db);

        var user = new User
        {
            Email = "unconfirmed@example.com", Name = "Test",
            IsEmailConfirmed = false,
            CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow
        };
        user.PasswordHash = new PasswordHasher<User>().HashPassword(user, "Password123!");
        db.Users.Add(user);
        await db.SaveChangesAsync();

        var (result, _) = await svc.LoginAsync(new LoginRequestDto
        {
            Email = "unconfirmed@example.com",
            Password = "Password123!"
        });

        Assert.False(result.Success);
        Assert.Contains(result.Errors, e => e.Contains("confirm your email"));
    }

    [Fact]
    public async Task Login_WithConfirmedEmail_Succeeds()
    {
        var db = CreateDb();
        var svc = CreateService(db);
        await CreateConfirmedUser(db, "confirmed@example.com");

        var (result, _) = await svc.LoginAsync(new LoginRequestDto
        {
            Email = "confirmed@example.com",
            Password = "Password123!"
        });

        Assert.True(result.Success);
    }

    // ════════════════════════════════════════════════════════════
    //  Forgot password — egzistuojantis / neegzistuojantis el. paštas
    // ════════════════════════════════════════════════════════════

    [Fact]
    public async Task ForgotPassword_WithExistingEmail_ReturnsOkAndSendsEmail()
    {
        var db = CreateDb();
        var emailMock = new Mock<IEmailService>();
        var svc = CreateService(db, emailMock.Object);
        await CreateConfirmedUser(db, "reset@example.com");

        var result = await svc.ForgotPasswordAsync("reset@example.com");

        Assert.True(result.Success); // Visada Ok
        await Task.Delay(100);
        emailMock.Verify(e => e.SendPasswordResetAsync(
            "reset@example.com", It.IsAny<string>(), It.IsAny<string>()), Times.Once);
    }

    [Fact]
    public async Task ForgotPassword_WithNonExistingEmail_AlsoReturnsOk()
    {
        var db = CreateDb();
        var emailMock = new Mock<IEmailService>();
        var svc = CreateService(db, emailMock.Object);

        var result = await svc.ForgotPasswordAsync("doesnotexist@example.com");

        Assert.True(result.Success); // Neskleidžiame informacijos
        await Task.Delay(100);
        emailMock.Verify(e => e.SendPasswordResetAsync(
            It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()), Times.Never);
    }

    // ════════════════════════════════════════════════════════════
    //  Reset password — teisinga / neteisinga / panaudota
    // ════════════════════════════════════════════════════════════

    [Fact]
    public async Task ResetPassword_WithValidToken_Succeeds()
    {
        var db = CreateDb();
        var svc = CreateService(db);

        var user = await CreateConfirmedUser(db, "resettable@example.com");
        user.PasswordResetToken = "reset-token-123";
        user.PasswordResetTokenExpiry = DateTime.UtcNow.AddHours(1);
        user.PasswordResetTokenUsed = false;
        await db.SaveChangesAsync();

        var result = await svc.ResetPasswordAsync(new ResetPasswordRequestDto
        {
            Token = "reset-token-123",
            NewPassword = "NewPassword456!"
        });

        Assert.True(result.Success);

        // Patikrinti, kad token invaliduotas
        var updated = await db.Users.FindAsync(user.Id);
        Assert.True(updated!.PasswordResetTokenUsed);
        Assert.Null(updated.PasswordResetToken);
    }

    [Fact]
    public async Task ResetPassword_WithInvalidToken_Fails()
    {
        var db = CreateDb();
        var svc = CreateService(db);

        var result = await svc.ResetPasswordAsync(new ResetPasswordRequestDto
        {
            Token = "fake-token",
            NewPassword = "NewPassword456!"
        });

        Assert.False(result.Success);
        Assert.Contains(result.Errors, e => e.Contains("Invalid"));
    }

    [Fact]
    public async Task ResetPassword_WithUsedToken_Fails()
    {
        var db = CreateDb();
        var svc = CreateService(db);

        var user = await CreateConfirmedUser(db, "used@example.com");
        user.PasswordResetToken = "used-token";
        user.PasswordResetTokenExpiry = DateTime.UtcNow.AddHours(1);
        user.PasswordResetTokenUsed = true; // Jau panaudotas
        await db.SaveChangesAsync();

        var result = await svc.ResetPasswordAsync(new ResetPasswordRequestDto
        {
            Token = "used-token",
            NewPassword = "NewPassword456!"
        });

        Assert.False(result.Success);
        Assert.Contains(result.Errors, e => e.Contains("already been used"));
    }

    [Fact]
    public async Task ResetPassword_WithExpiredToken_Fails()
    {
        var db = CreateDb();
        var svc = CreateService(db);

        var user = await CreateConfirmedUser(db, "expired2@example.com");
        user.PasswordResetToken = "expired-reset-token";
        user.PasswordResetTokenExpiry = DateTime.UtcNow.AddHours(-1); // Pasibaigęs
        user.PasswordResetTokenUsed = false;
        await db.SaveChangesAsync();

        var result = await svc.ResetPasswordAsync(new ResetPasswordRequestDto
        {
            Token = "expired-reset-token",
            NewPassword = "NewPassword456!"
        });

        Assert.False(result.Success);
        Assert.Contains(result.Errors, e => e.Contains("expired"));
    }

    [Fact]
    public async Task ResetPassword_InvalidatesAllRefreshTokens()
    {
        var db = CreateDb();
        var svc = CreateService(db);

        var user = await CreateConfirmedUser(db, "revokeall@example.com");
        user.PasswordResetToken = "revoke-token";
        user.PasswordResetTokenExpiry = DateTime.UtcNow.AddHours(1);

        // Pridėti kelis refresh tokens
        db.RefreshTokens.AddRange(
            new RefreshToken { Token = "rt1", UserId = user.Id, RevokedAt = null, ExpiresAt = DateTime.UtcNow.AddDays(7), CreatedAt = DateTime.UtcNow },
            new RefreshToken { Token = "rt2", UserId = user.Id, RevokedAt = null, ExpiresAt = DateTime.UtcNow.AddDays(7), CreatedAt = DateTime.UtcNow });
        await svc.ResetPasswordAsync(new ResetPasswordRequestDto
        {
            Token = "revoke-token",
            NewPassword = "NewPassword456!"
        });

        var tokens = await db.RefreshTokens.Where(rt => rt.UserId == user.Id).ToListAsync();
        Assert.All(tokens, rt => Assert.NotNull(rt.RevokedAt));
    }
}
