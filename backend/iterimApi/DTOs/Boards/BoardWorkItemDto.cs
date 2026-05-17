using iterimApi.DTOs.Tags;

namespace iterimApi.DTOs.Boards;

public class BoardWorkItemDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Type { get; set; } = string.Empty;
    public int? Points { get; set; }
    public AssignedMemberDto? AssignedMember { get; set; }
    public List<TagDto> Tags { get; set; } = [];
    public List<BoardBlockerDto> Blockers { get; set; } = [];
    public int CommentCount { get; set; }
}

public class AssignedMemberDto
{
    public int Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
}

public class BoardBlockerDto
{
    public int DependencyId { get; set; }
    public int WorkItemId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public int TeamId { get; set; }
    public string TeamName { get; set; } = string.Empty;
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public int OrgId { get; set; }
}