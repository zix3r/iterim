namespace iterimApi.DTOs.Users;

public class RecentPageDto
{
    public string Path { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public string IconType { get; set; } = string.Empty;
    public DateTime AccessedAt { get; set; } = DateTime.UtcNow;
}