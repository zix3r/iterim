using System.Text.Json;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace iterimApi.HealthChecks;

public static class HealthCheckResponseWriter
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = true
    };

    /// <summary>
    /// /health — minimal response for uptime monitors
    /// </summary>
    public static async Task WriteMinimal(HttpContext context, HealthReport report)
    {
        context.Response.ContentType = "application/json";
        context.Response.StatusCode = report.Status == HealthStatus.Healthy ? 200 : 503;

        var result = new
        {
            status = report.Status.ToString(),
            timestamp = DateTime.UtcNow
        };

        await context.Response.WriteAsync(JsonSerializer.Serialize(result, JsonOptions));
    }

    /// <summary>
    /// /health/detail — full breakdown for admin panel
    /// </summary>
    public static async Task WriteDetailed(HttpContext context, HealthReport report)
    {
        context.Response.ContentType = "application/json";
        context.Response.StatusCode = report.Status == HealthStatus.Healthy ? 200 : 503;

        var result = new
        {
            status = report.Status.ToString(),
            totalDuration = report.TotalDuration.ToString(),
            timestamp = DateTime.UtcNow,
            checks = report.Entries.Select(e => new
            {
                name = e.Key,
                status = e.Value.Status.ToString(),
                duration = e.Value.Duration.ToString(),
                description = e.Value.Description,
                data = e.Value.Data?.ToDictionary(d => d.Key, d => d.Value)
            })
        };

        await context.Response.WriteAsync(JsonSerializer.Serialize(result, JsonOptions));
    }
}