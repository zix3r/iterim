using iterimApi.Models.Enums;

namespace iterimApi.DTOs.Metrics;

public class SprintMetricsDto
{
    public int IterationId { get; set; }
    public string? Name { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public string Status { get; set; } = string.Empty;

    public int TotalPoints { get; set; }
    public int CompletedPoints { get; set; }
    public int RemainingPoints { get; set; }
    public decimal PercentComplete { get; set; }

    public Dictionary<string, int> ByStatus { get; set; } = [];
    public Dictionary<string, int> ByType { get; set; } = [];

    public List<BurndownPoint> Burndown { get; set; } = [];
}

public class BurndownPoint
{
    public DateOnly Date { get; set; }
    public int RemainingPoints { get; set; }
    public int IdealPoints { get; set; }
}
