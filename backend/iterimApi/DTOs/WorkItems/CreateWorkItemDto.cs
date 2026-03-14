using System.ComponentModel.DataAnnotations;
using iterimApi.Models.Enums;

namespace iterimApi.DTOs.WorkItems;

public class CreateWorkItemDto
{
    [Required]
    [MaxLength(500)]
    public string Title { get; set; } = string.Empty;

    public string? Description { get; set; }

    [Required]
    public WorkItemType Type { get; set; }

    public WorkItemPriority Priority { get; set; } = WorkItemPriority.Medium;

    public int? Points { get; set; }

    /// <summary>
    /// TeamMember.Id (not User.Id)
    /// </summary>
    public int? AssignedTo { get; set; }
}
