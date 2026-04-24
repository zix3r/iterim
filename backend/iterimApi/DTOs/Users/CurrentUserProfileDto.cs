namespace iterimApi.DTOs.Users;

public class CurrentUserProfileDto
{
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public string Theme { get; set; } = "light";
    public DateTime CreatedAt { get; set; }
}
