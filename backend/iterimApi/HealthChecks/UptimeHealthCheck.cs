using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace iterimApi.HealthChecks;

public class UptimeHealthCheck : IHealthCheck
{
    private static readonly DateTime StartTime = DateTime.UtcNow;

    public Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context, CancellationToken cancellationToken = default)
    {
        var uptime = DateTime.UtcNow - StartTime;

        return Task.FromResult(HealthCheckResult.Healthy("Running", new Dictionary<string, object>
        {
            ["uptime"] = $"{(int)uptime.TotalDays}d {uptime.Hours}h {uptime.Minutes}m",
            ["startedAt"] = StartTime.ToString("o"),
            ["uptimeSeconds"] = (int)uptime.TotalSeconds
        }));
    }
}