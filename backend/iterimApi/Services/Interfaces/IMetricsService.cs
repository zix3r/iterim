using iterimApi.DTOs.Metrics;

namespace iterimApi.Services.Interfaces;

public interface IMetricsService
{
    /// <summary>
    /// Returns velocity data for the last N completed sprints before (and including) the given iteration.
    /// If beforeIterationId is null, returns the last N completed sprints overall.
    /// </summary>
    Task<VelocityDto> GetVelocityAsync(int teamId, int userId, int sprintCount = 5, int? beforeIterationId = null);

    /// <summary>
    /// Returns sprint progress stats and burndown data for a given iteration.
    /// </summary>
    Task<SprintMetricsDto> GetSprintMetricsAsync(int iterationId, int userId);

    /// <summary>
    /// Returns team capacity (work days vs absence days) for a given date range.
    /// </summary>
    Task<CapacityDto> GetCapacityAsync(int teamId, int userId, DateOnly fromDate, DateOnly toDate);
}
