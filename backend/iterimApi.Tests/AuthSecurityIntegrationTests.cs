using System.Net;
using System.Net.Http.Json;
using iterimApi.Tests.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace iterimApi.Tests;

public class AuthSecurityIntegrationTests : IClassFixture<ApiTestFactory>
{
    private readonly ApiTestFactory _factory;

    public AuthSecurityIntegrationTests(ApiTestFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task Register_WithDuplicateEmail_ReturnsConflict()
    {
        await _factory.ResetDatabaseAsync();

        using var client = _factory.CreateApiClient();

        var first = await client.PostAsJsonAsync("/api/auth/register", new
        {
            email = "dup@example.com",
            password = "Password123!",
            name = "User One"
        });

        var second = await client.PostAsJsonAsync("/api/auth/register", new
        {
            email = "dup@example.com",
            password = "Password123!",
            name = "User Two"
        });

        Assert.Equal(HttpStatusCode.OK, first.StatusCode);
        Assert.Equal(HttpStatusCode.Conflict, second.StatusCode);
    }

    [Fact]
    public async Task RefreshTokenRotation_RejectsOldRefreshTokenAfterUse()
    {
        await _factory.ResetDatabaseAsync();

        await _factory.ExecuteDbContextAsync(async db =>
        {
            await TestDataSeeder.CreateUserAsync(
                db,
                "confirmed.refresh@example.com",
                "Refresh User",
                password: "Password123!",
                isEmailConfirmed: true);
        });

        using var client = _factory.CreateApiClient(handleCookies: false);

        var login = await client.PostAsJsonAsync("/api/auth/login", new
        {
            email = "confirmed.refresh@example.com",
            password = "Password123!"
        });

        Assert.Equal(HttpStatusCode.OK, login.StatusCode);
        Assert.True(login.Headers.TryGetValues("Set-Cookie", out var loginCookies));

        var oldRefreshToken = TestJsonHelpers.ExtractCookieValue(loginCookies!, "refresh_token");
        Assert.False(string.IsNullOrWhiteSpace(oldRefreshToken));

        var refreshRequest1 = new HttpRequestMessage(HttpMethod.Post, "/api/auth/refresh");
        refreshRequest1.Headers.Add("Cookie", $"refresh_token={oldRefreshToken}");
        var refresh1 = await client.SendAsync(refreshRequest1);

        Assert.Equal(HttpStatusCode.OK, refresh1.StatusCode);

        var refreshRequest2 = new HttpRequestMessage(HttpMethod.Post, "/api/auth/refresh");
        refreshRequest2.Headers.Add("Cookie", $"refresh_token={oldRefreshToken}");
        var refresh2 = await client.SendAsync(refreshRequest2);

        Assert.Equal(HttpStatusCode.Unauthorized, refresh2.StatusCode);
    }

    [Fact]
    public async Task PasswordHash_UsesSalt_AndIsNotPlaintext()
    {
        await _factory.ResetDatabaseAsync();

        using var client = _factory.CreateApiClient();

        var register1 = await client.PostAsJsonAsync("/api/auth/register", new
        {
            email = "salt1@example.com",
            password = "SamePassword123!",
            name = "Salt User 1"
        });

        var register2 = await client.PostAsJsonAsync("/api/auth/register", new
        {
            email = "salt2@example.com",
            password = "SamePassword123!",
            name = "Salt User 2"
        });

        Assert.Equal(HttpStatusCode.OK, register1.StatusCode);
        Assert.Equal(HttpStatusCode.OK, register2.StatusCode);

        var hashes = await _factory.ExecuteDbContextAsync(async db =>
            await db.Users
                .Where(u => u.Email == "salt1@example.com" || u.Email == "salt2@example.com")
                .OrderBy(u => u.Email)
                .Select(u => u.PasswordHash)
                .ToListAsync());

        Assert.Equal(2, hashes.Count);
        Assert.NotEqual(hashes[0], hashes[1]);
        Assert.NotEqual("SamePassword123!", hashes[0]);
        Assert.NotEqual("SamePassword123!", hashes[1]);
        Assert.StartsWith("AQAAAA", hashes[0]);
    }

    [Fact]
    public async Task AuthResponses_DoNotExposeSensitiveFields()
    {
        await _factory.ResetDatabaseAsync();

        int userId = 0;
        await _factory.ExecuteDbContextAsync(async db =>
        {
            var user = await TestDataSeeder.CreateUserAsync(db, "me@example.com", "Me User");
            userId = user.Id;
        });

        using var registerClient = _factory.CreateApiClient();
        var registerResponse = await registerClient.PostAsJsonAsync("/api/auth/register", new
        {
            email = "nosensitive@example.com",
            password = "Password123!",
            name = "No Sensitive"
        });

        Assert.Equal(HttpStatusCode.OK, registerResponse.StatusCode);

        using var registerJson = await TestJsonHelpers.ReadJsonAsync(registerResponse);
        Assert.False(registerJson.RootElement.TryGetProperty("passwordHash", out _));
        Assert.False(registerJson.RootElement.TryGetProperty("password", out _));

        using var meClient = _factory.CreateApiClient(userId);
        var meResponse = await meClient.GetAsync("/api/auth/me");
        Assert.Equal(HttpStatusCode.OK, meResponse.StatusCode);

        using var meJson = await TestJsonHelpers.ReadJsonAsync(meResponse);
        Assert.False(meJson.RootElement.TryGetProperty("passwordHash", out _));
        Assert.False(meJson.RootElement.TryGetProperty("refreshTokens", out _));
    }
}
