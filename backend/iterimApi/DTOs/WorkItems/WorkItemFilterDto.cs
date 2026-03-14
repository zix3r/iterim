using iterimApi.Models.Enums;

namespace iterimApi.DTOs.WorkItems;

/// <summary>
/// Query parameters for filtering work items in a team backlog.
/// All filters are optional — omit to get everything.
/// </summary>
public class WorkItemFilterDto
{
    public WorkItemType? Type { get; set; }
    public WorkItemStatus? Status { get; set; }
    public WorkItemPriority? Priority { get; set; }

    /// <summary>
    /// Filter by TeamMember.Id
    /// </summary>
    public int? AssignedTo { get; set; }

    /// <summary>
    /// Filter by Iteration.Id. Use 0 to get only backlog items (IterationId == null).
    /// </summary>
    public int? IterationId { get; set; }
}
