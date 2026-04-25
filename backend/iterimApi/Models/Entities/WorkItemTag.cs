namespace iterimApi.Models.Entities;

public class WorkItemTag
{
    public int WorkItemId { get; set; }
    public int TagId { get; set; }

    // Navigation
    public WorkItem WorkItem { get; set; } = null!;
    public Tag Tag { get; set; } = null!;
}
