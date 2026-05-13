namespace iterimApi.DTOs.Retro;

public class RetroItemDto
{
    public int Id { get; set; }
    public int IterationId { get; set; }
    public int UserId { get; set; }
    public string AuthorName { get; set; } = string.Empty;
    public string? AuthorAvatarUrl { get; set; }

    /// <summary>"WentWell" | "DidntGoWell" | "ActionItem" — string for FE friendliness.</summary>
    public string Column { get; set; } = string.Empty;

    public string Content { get; set; } = string.Empty;
    public int VoteCount { get; set; }

    /// <summary>True if the requesting user has voted for this card.</summary>
    public bool HasVoted { get; set; }

    /// <summary>True if the requesting user authored this card (controls Edit/Delete UI).</summary>
    public bool IsOwn { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
