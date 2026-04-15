using System.ComponentModel.DataAnnotations;

namespace iterimApi.DTOs.Users;

public class ChangePasswordDto
{
    [Required]
    public string OldPassword { get; set; } = string.Empty;

    [Required]
    [MinLength(8)]
    [RegularExpression(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$",
        ErrorMessage = "New password must contain uppercase, lowercase, and number.")]
    public string NewPassword { get; set; } = string.Empty;
}
