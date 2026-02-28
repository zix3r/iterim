using iterimApi.Models.Enums;

namespace iterimApi.Models.Entities;

public class WorkItem
{
    public int Id { get; set; }
    public int TeamId { get; set; }
    public int? IterationId { get; set; }
    public int? AssignedTo { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int? Points { get; set; }
    public WorkItemType Type { get; set; }
    public WorkItemPriority Priority { get; set; } = WorkItemPriority.Medium;
    public WorkItemStatus Status { get; set; } = WorkItemStatus.Backlog;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public int CreatedBy { get; set; }
    public int UpdatedBy { get; set; }

    // Navigation
    public Team Team { get; set; } = null!;
    public Iteration? Iteration { get; set; }
    public TeamMember? AssignedMember { get; set; }
    public User CreatedByUser { get; set; } = null!;
    public User UpdatedByUser { get; set; } = null!;
    public ICollection<WorkItemComment> Comments { get; set; } = [];
    public ICollection<WorkItemHistory> History { get; set; } = [];
}