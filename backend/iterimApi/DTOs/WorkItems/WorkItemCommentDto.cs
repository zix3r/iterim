namespace iterimApi.DTOs.WorkItems;

public class WorkItemCommentDto
{
    public int Id { get; set; }
    public int WorkItemId { get; set; }
    public int AuthorId { get; set; }
    public int AuthorUserId { get; set; }
    public string AuthorName { get; set; } = string.Empty;
    public string? AuthorAvatarUrl { get; set; }
    public string Content { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
