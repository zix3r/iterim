using System.ComponentModel.DataAnnotations;

namespace iterimApi.DTOs.Users;

public class UpdateAvatarDto
{
    [Required]
    [MaxLength(2000000)]
    public string AvatarUrl { get; set; } = string.Empty;
}
