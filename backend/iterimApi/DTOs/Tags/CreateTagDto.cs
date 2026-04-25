using System.ComponentModel.DataAnnotations;

namespace iterimApi.DTOs.Tags;

public class CreateTagDto
{
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = "";

    [MaxLength(20)]
    public string Color { get; set; } = "#6366f1";
}
