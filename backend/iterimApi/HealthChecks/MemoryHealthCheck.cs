using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace iterimApi.HealthChecks;

public class MemoryHealthCheck : IHealthCheck
{
    public Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context, CancellationToken cancellationToken = default)
    {
        var allocated = GC.GetTotalMemory(forceFullCollection: false);
        var allocatedMB = allocated / 1024.0 / 1024.0;
        var gen0 = GC.CollectionCount(0);
        var gen1 = GC.CollectionCount(1);
        var gen2 = GC.CollectionCount(2);

        var data = new Dictionary<string, object>
        {
            ["allocatedMB"] = Math.Round(allocatedMB, 1),
            ["gcGen0"] = gen0,
            ["gcGen1"] = gen1,
            ["gcGen2"] = gen2
        };

        // Degrade if using more than 500MB
        if (allocatedMB > 500)
            return Task.FromResult(HealthCheckResult.Degraded("High memory usage", data: data));

        return Task.FromResult(HealthCheckResult.Healthy("OK", data));
    }
}