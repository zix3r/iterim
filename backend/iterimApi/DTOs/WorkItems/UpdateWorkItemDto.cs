using System.ComponentModel.DataAnnotations;
using iterimApi.Models.Enums;

namespace iterimApi.DTOs.WorkItems;

public class UpdateWorkItemDto
{
    public WorkItemType? Type { get; set; }

    [Required(ErrorMessage = "Title is required.")]
    [MaxLength(500, ErrorMessage = "Title cannot exceed 500 characters.")]
    public string Title { get; set; } = string.Empty;

    public string? Description { get; set; }

    public WorkItemPriority Priority { get; set; } = WorkItemPriority.Medium;

    [Range(0, int.MaxValue, ErrorMessage = "Points cannot be negative.")]
    public int? Points { get; set; }

    public WorkItemStatus Status { get; set; } = WorkItemStatus.Backlog;

    /// <summary>
    /// TeamMember.Id (not User.Id). Set to null to unassign.
    /// </summary>
    [Range(1, int.MaxValue, ErrorMessage = "Assignee must be a valid team member.")]
    public int? AssignedTo { get; set; }

    /// <summary>
    /// Set to an Iteration.Id to assign to a sprint, or null to move back to backlog.
    /// </summary>
    [Range(1, int.MaxValue, ErrorMessage = "Iteration must be a valid sprint.")]
    public int? IterationId { get; set; }
}
