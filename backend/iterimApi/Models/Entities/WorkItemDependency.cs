namespace iterimApi.Models.Entities;

public class WorkItemDependency
{
    public int Id { get; set; }
    public int BlockerWorkItemId { get; set; }
    public int BlockedWorkItemId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public int CreatedBy { get; set; }

    public WorkItem BlockerWorkItem { get; set; } = null!;
    public WorkItem BlockedWorkItem { get; set; } = null!;
    public OrganizationMember CreatedByMember { get; set; } = null!;
}
