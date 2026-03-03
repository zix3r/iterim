using iterimApi.Models.Enums;

namespace iterimApi.Models.Entities;

public class Iteration
{
    public int Id { get; set; }
    public int TeamId { get; set; }
    public string? Name { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public string? Goal { get; set; }
    public IterationStatus Status { get; set; } = IterationStatus.Planning;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public int CreatedBy { get; set; }
    public int UpdatedBy { get; set; }

    // Navigation
    public Team Team { get; set; } = null!;
    public User CreatedByUser { get; set; } = null!;
    public User UpdatedByUser { get; set; } = null!;
    public ICollection<WorkItem> WorkItems { get; set; } = [];
}