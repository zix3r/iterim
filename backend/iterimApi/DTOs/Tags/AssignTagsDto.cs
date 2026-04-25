using System.ComponentModel.DataAnnotations;

namespace iterimApi.DTOs.Tags;

public class AssignTagsDto
{
    [Required]
    public List<int> TagIds { get; set; } = [];
}
