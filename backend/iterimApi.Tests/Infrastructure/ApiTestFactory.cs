using iterimApi.Data;
using iterimApi.Services.Interfaces;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace iterimApi.Tests.Infrastructure;

public class ApiTestFactory : WebApplicationFactory<Program>
{
    private readonly string _databaseName = $"iterim-tests-{Guid.NewGuid()}";

    protected override void ConfigureWebHost(Microsoft.AspNetCore.Hosting.IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");

        builder.ConfigureAppConfiguration((_, config) =>
        {
            var testConfig = new Dictionary<string, string?>
            {
                ["ConnectionStrings:DefaultConnection"] = "Server=localhost;Database=iterim_test;Uid=test;Pwd=test;",
                ["JwtSettings:Secret"] = "this-is-a-test-secret-key-that-is-long-enough-12345",
                ["JwtSettings:Issuer"] = "iterim-test",
                ["JwtSettings:Audience"] = "iterim-test-clients",
                ["JwtSettings:AccessTokenExpirationMinutes"] = "15",
                ["JwtSettings:RefreshTokenExpirationDays"] = "7",
                ["Email:Provider"] = "none",
                ["Email:FromEmail"] = "test@iterim.local",
                ["Email:FromName"] = "iterim-tests"
            };

            config.AddInMemoryCollection(testConfig);
        });

        builder.ConfigureServices(services =>
        {
            services.RemoveAll<DbContextOptions<AppDbContext>>();
            services.RemoveAll<AppDbContext>();

            services.AddDbContext<AppDbContext>(options =>
                options.UseInMemoryDatabase(_databaseName));

            services.RemoveAll<IEmailService>();
            services.AddSingleton<IEmailService, NoopEmailService>();

            services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = TestAuthHandler.SchemeName;
                options.DefaultChallengeScheme = TestAuthHandler.SchemeName;
            }).AddScheme<AuthenticationSchemeOptions, TestAuthHandler>(TestAuthHandler.SchemeName, _ => { });
        });
    }

    public HttpClient CreateApiClient(int? userId = null, bool handleCookies = true)
    {
        var client = CreateClient(new WebApplicationFactoryClientOptions
        {
            BaseAddress = new Uri("https://localhost"),
            AllowAutoRedirect = false,
            HandleCookies = handleCookies
        });

        if (userId.HasValue)
        {
            client.DefaultRequestHeaders.Add("X-Test-UserId", userId.Value.ToString());
        }

        return client;
    }

    public async Task ResetDatabaseAsync()
    {
        using var scope = Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        await db.Database.EnsureDeletedAsync();
        await db.Database.EnsureCreatedAsync();
    }

    public async Task ExecuteDbContextAsync(Func<AppDbContext, Task> action)
    {
        using var scope = Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await action(db);
    }

    public async Task<T> ExecuteDbContextAsync<T>(Func<AppDbContext, Task<T>> action)
    {
        using var scope = Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        return await action(db);
    }
}
