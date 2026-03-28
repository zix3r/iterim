using System.ComponentModel.DataAnnotations;

namespace iterimApi.DTOs.WorkItems;

public class ReorderWorkItemsDto
{
    [Required]
    public List<ReorderItemDto> Items { get; set; } = [];
}

public class ReorderItemDto
{
    public int Id { get; set; }
    public int Position { get; set; }
}