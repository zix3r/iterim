using System.ComponentModel.DataAnnotations;
using iterimApi.Models.Enums;

namespace iterimApi.DTOs.WorkItems;

public class CreateWorkItemDto
{
    [Required(ErrorMessage = "Title is required.")]
    [MaxLength(500, ErrorMessage = "Title cannot exceed 500 characters.")]
    public string Title { get; set; } = string.Empty;

    public string? Description { get; set; }

    [Required(ErrorMessage = "Type is required.")]
    public WorkItemType Type { get; set; }

    public WorkItemPriority Priority { get; set; } = WorkItemPriority.Medium;

    [Range(0, int.MaxValue, ErrorMessage = "Points cannot be negative.")]
    public int? Points { get; set; }

    /// <summary>
    /// TeamMember.Id (not User.Id)
    /// </summary>
    [Range(1, int.MaxValue, ErrorMessage = "Assignee must be a valid team member.")]
    public int? AssignedTo { get; set; }
}
