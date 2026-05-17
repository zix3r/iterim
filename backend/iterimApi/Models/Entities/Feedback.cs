using iterimApi.Models.Enums;

namespace iterimApi.Models.Entities;

public class Feedback
{
    public int Id { get; set; }
    public int UserId { get; set; }

    /// <summary>UI language at submission time ("lt" or "en").</summary>
    public string Language { get; set; } = "en";

    // ── Core questions ─────────────────────────────────────
    public int SprintsUsed { get; set; }
    public int OverallRating { get; set; } // 1-5
    public bool WasSatisfied { get; set; }

    /// <summary>Bitwise combination of FeedbackDissatisfactionReason values.</summary>
    public FeedbackDissatisfactionReason DissatisfactionReasons { get; set; } = FeedbackDissatisfactionReason.None;

    // ── Conditional follow-ups (nullable — only filled when relevant reason selected) ──
    public string? MissedFunctionalities { get; set; }
    public string? HardestToFind { get; set; }
    public int? DaysToGetUsedTo { get; set; }
    public string? MissedIntegrations { get; set; }
    public decimal? AcceptableMonthlyPricePerUser { get; set; }
    public string? OtherReasonDescription { get; set; }
    public string? UnmentionedFlawDescription { get; set; }

    // ── Additional questions ──────────────────────────────
    public string? MostUsefulFeature { get; set; }
    public bool EncounteredBugs { get; set; }
    public string? BugContext { get; set; }
    public bool WouldTryAgain { get; set; }

    // ── Admin tracking ────────────────────────────────────
    public bool IsReviewed { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public int? ReviewedBy { get; set; }
    public DateTime? ReviewedAt { get; set; }

    // ── Navigation ────────────────────────────────────────
    public User User { get; set; } = null!;
    public User? ReviewedByUser { get; set; }
}