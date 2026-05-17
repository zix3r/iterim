using System.ComponentModel.DataAnnotations;
using iterimApi.Models.Enums;

namespace iterimApi.DTOs.WorkItems;

public class ImportWorkItemDto
{
    [Required]
    [MaxLength(500)]
    public string Title { get; set; } = string.Empty;

    public string? Description { get; set; }

    [Required]
    public WorkItemType Type { get; set; }

    public WorkItemPriority Priority { get; set; } = WorkItemPriority.Medium;

    public WorkItemStatus Status { get; set; } = WorkItemStatus.Backlog;

    [Range(0, int.MaxValue)]
    public int? Points { get; set; }

    public int? AssignedTo { get; set; }

    public int? IterationId { get; set; }
}

public class BulkCreateWorkItemsDto
{
    [Required]
    [MinLength(1, ErrorMessage = "At least one item is required.")]
    public List<ImportWorkItemDto> Items { get; set; } = [];
}
