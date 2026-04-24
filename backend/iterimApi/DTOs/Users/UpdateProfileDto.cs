using System.ComponentModel.DataAnnotations;

namespace iterimApi.DTOs.Users;

public class UpdateProfileDto
{
    [Required]
    [MinLength(2)]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    [MaxLength(255)]
    public string Email { get; set; } = string.Empty;

    [RegularExpression("^(?i:light|dark)$", ErrorMessage = "Theme must be one of: light, dark.")]
    public string? Theme { get; set; }
}
