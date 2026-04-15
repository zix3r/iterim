using System.ComponentModel.DataAnnotations;

namespace iterimApi.DTOs.Auth;

public class ResendConfirmationRequestDto
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;
}