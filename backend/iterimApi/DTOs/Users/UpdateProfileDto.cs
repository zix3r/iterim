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

    /// <summary>
    /// Pasirinkta UI kalba (pvz., "lt", "en"). Naudojama el. laiškų lokalizacijai
    /// (kai keičiamas el. paštas — siunčiamas patvirtinimo laiškas).
    /// </summary>
    public string? Language { get; set; }
}
