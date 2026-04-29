namespace iterimApi.DTOs.Metrics;

public class VelocityDto
{
    public List<SprintVelocityItem> Sprints { get; set; } = [];
    public decimal AverageVelocity { get; set; }
}

public class SprintVelocityItem
{
    public int IterationId { get; set; }
    public string? Name { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public int PlannedPoints { get; set; }
    public int CompletedPoints { get; set; }
    /// <summary>
    /// Iteration status as string ("Active", "Completed"). Lets the frontend
    /// visually distinguish in-progress sprints from finished ones.
    /// </summary>
    public string Status { get; set; } = string.Empty;
}
