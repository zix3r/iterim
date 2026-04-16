namespace iterimApi.Models.Entities;

public class PinnedTeam
{
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    
    public int TeamId { get; set; }
    public Team Team { get; set; } = null!;

    public DateTime PinnedAt { get; set; } = DateTime.UtcNow;
}
