using System.ComponentModel.DataAnnotations;

namespace iterimApi.DTOs.Auth;

public class ResendConfirmationRequestDto
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// Pasirinkta UI kalba (pvz., "lt", "en"). Naudojama el. laiškų lokalizacijai.
    /// </summary>
    public string? Language { get; set; }
}
