using iterimApi.DTOs.Tags;
using iterimApi.DTOs.Teams;

namespace iterimApi.DTOs.WorkItems;

public class WorkItemDto
{
    public int Id { get; set; }
    public int TeamId { get; set; }
    public int? IterationId { get; set; }
    public int? AssignedTo { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int? Points { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Priority { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public int Position { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public int CreatedBy { get; set; }
    public int UpdatedBy { get; set; }
    public string CreatedByName { get; set; } = string.Empty;
    public string UpdatedByName { get; set; } = string.Empty;
    public TeamMemberDto? AssignedMember { get; set; }
    public List<TagDto> Tags { get; set; } = [];
    public int BlockerCount { get; set; }
    public int BlocksCount { get; set; }
    public string? TeamName { get; set; }
}
