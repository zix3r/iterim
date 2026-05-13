using System.ComponentModel.DataAnnotations;
using iterimApi.Models.Enums;

namespace iterimApi.DTOs.Retro;

public class CreateRetroItemDto
{
    [Required]
    public RetroColumn Column { get; set; }

    [Required(ErrorMessage = "Content is required.")]
    [MinLength(1, ErrorMessage = "Content cannot be empty.")]
    [MaxLength(2000, ErrorMessage = "Content cannot exceed 2000 characters.")]
    public string Content { get; set; } = string.Empty;
}
