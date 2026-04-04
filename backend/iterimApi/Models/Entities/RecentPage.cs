namespace iterimApi.Models.Entities;

public class RecentPage
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string Path { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public string IconType { get; set; } = string.Empty;
    public DateTime AccessedAt { get; set; } = DateTime.UtcNow;

    public User? User { get; set; }
}