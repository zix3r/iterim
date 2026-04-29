namespace iterimApi.DTOs.Atpa;

/// <summary>
/// A single assignment suggestion produced by the ATPA algorithm.
/// Represents a recommendation only — the user must confirm or reject it.
/// </summary>
public class AssignmentSuggestionDto
{
    public int WorkItemId { get; set; }
    public string WorkItemTitle { get; set; } = string.Empty;
    public int WorkItemPoints { get; set; }
    public List<string> WorkItemTags { get; set; } = [];

    public int SuggestedMemberId { get; set; }
    public string MemberName { get; set; } = string.Empty;
    public List<string> MemberTags { get; set; } = [];

    /// <summary>
    /// Confidence score expressed as a percentage (0–100).
    /// Calculated from the final score (tag match + capacity).
    /// </summary>
    public double Confidence { get; set; }

    /// <summary>
    /// Human-readable reason for this suggestion, useful for tooltips/UI.
    /// </summary>
    public string Reason { get; set; } = string.Empty;
}
