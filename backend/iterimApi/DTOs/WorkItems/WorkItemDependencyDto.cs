using iterimApi.DTOs.Tags;
using iterimApi.DTOs.Teams;

namespace iterimApi.DTOs.WorkItems;

public class WorkItemDependencyDto
{
    public int DependencyId { get; set; }
    public int WorkItemId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int? Points { get; set; }
    public int TeamId { get; set; }
    public string TeamName { get; set; } = string.Empty;
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public int OrgId { get; set; }
    public TeamMemberDto? AssignedMember { get; set; }
    public List<TagDto> Tags { get; set; } = [];
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class WorkItemDependenciesDto
{
    public List<WorkItemDependencyDto> Blocks { get; set; } = [];
    public List<WorkItemDependencyDto> BlockedBy { get; set; } = [];
}

public class CreateDependencyDto
{
    public int BlockedByWorkItemId { get; set; }
}
