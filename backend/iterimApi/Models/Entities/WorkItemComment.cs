namespace iterimApi.Models.Entities;

public class WorkItemComment
{
    public int Id { get; set; }
    public int WorkItemId { get; set; }
    public int AuthorId { get; set; }
    public int? ParentCommentId { get; set; }
    public string Message { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public WorkItem WorkItem { get; set; } = null!;
    public OrganizationMember Author { get; set; } = null!;
    public WorkItemComment? ParentComment { get; set; }
    public ICollection<WorkItemComment> Replies { get; set; } = [];
}