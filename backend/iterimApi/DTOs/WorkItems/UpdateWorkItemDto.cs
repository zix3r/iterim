using System.ComponentModel.DataAnnotations;
using iterimApi.Models.Enums;

namespace iterimApi.DTOs.WorkItems;

public class UpdateWorkItemDto
{
    [Required]
    [MaxLength(500)]
    public string Title { get; set; } = string.Empty;

    public string? Description { get; set; }

    public WorkItemPriority Priority { get; set; } = WorkItemPriority.Medium;

    public int? Points { get; set; }

    public WorkItemStatus Status { get; set; } = WorkItemStatus.Backlog;

    /// <summary>
    /// TeamMember.Id (not User.Id). Set to null to unassign.
    /// </summary>
    public int? AssignedTo { get; set; }

    /// <summary>
    /// Set to an Iteration.Id to assign to a sprint, or null to move back to backlog.
    /// </summary>
    public int? IterationId { get; set; }
}
