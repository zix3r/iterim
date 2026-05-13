using iterimApi.Models.Enums;

namespace iterimApi.Models.Entities;

/// <summary>
/// One sticky-note in the iteration retrospective board.
///
/// Authored by a User (not OrganizationMember) so we can preserve attribution
/// even if the author later leaves the team — the User row stays.
/// </summary>
public class RetroItem
{
    public int Id { get; set; }
    public int IterationId { get; set; }

    /// <summary>FK to the User who created this card. Author is the only one who can edit/delete.</summary>
    public int UserId { get; set; }

    public RetroColumn Column { get; set; }
    public string Content { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public Iteration Iteration { get; set; } = null!;
    public User User { get; set; } = null!;
    public ICollection<RetroVote> Votes { get; set; } = [];
}
