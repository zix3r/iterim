namespace iterimApi.Models.Entities;

public class WorkItemHistory
{
    public int Id { get; set; }
    public int WorkItemId { get; set; }
    public string FieldName { get; set; } = string.Empty;
    public string? OldValue { get; set; }
    public string? NewValue { get; set; }
    public DateTime ChangedAt { get; set; } = DateTime.UtcNow;
    public int ChangedBy { get; set; }

    // Navigation
    public WorkItem WorkItem { get; set; } = null!;
    public OrganizationMember ChangedByMember { get; set; } = null!;
}