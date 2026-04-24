using System.ComponentModel.DataAnnotations;

namespace iterimApi.DTOs.Users;

public class UpdateThemeDto
{
    [Required]
    [RegularExpression("^(?i:light|dark)$", ErrorMessage = "Theme must be one of: light, dark.")]
    public string Theme { get; set; } = "light";
}
