using System.ComponentModel.DataAnnotations;

namespace iterimApi.DTOs.Auth;

public class ConfirmEmailRequestDto
{
    [Required]
    public string Token { get; set; } = string.Empty;
}