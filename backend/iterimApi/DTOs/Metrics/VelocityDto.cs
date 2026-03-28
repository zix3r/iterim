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
}
