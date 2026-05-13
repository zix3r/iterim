namespace iterimApi.Models.Entities;

/// <summary>
/// One upvote on a retro card. Unique constraint (RetroItemId, UserId) enforces
/// at most one vote per user per card, so the toggle endpoint is idempotent.
/// </summary>
public class RetroVote
{
    public int Id { get; set; }
    public int RetroItemId { get; set; }
    public int UserId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public RetroItem RetroItem { get; set; } = null!;
    public User User { get; set; } = null!;
}
