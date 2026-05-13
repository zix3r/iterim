using System.ComponentModel.DataAnnotations;

namespace iterimApi.DTOs.Retro;

public class UpdateRetroItemDto
{
    [Required(ErrorMessage = "Content is required.")]
    [MinLength(1, ErrorMessage = "Content cannot be empty.")]
    [MaxLength(2000, ErrorMessage = "Content cannot exceed 2000 characters.")]
    public string Content { get; set; } = string.Empty;
}
