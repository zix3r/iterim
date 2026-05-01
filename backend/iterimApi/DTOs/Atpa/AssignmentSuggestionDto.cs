namespace iterimApi.DTOs.Atpa;

/// <summary>
/// A single assignment suggestion produced by the ATPA algorithm.
/// Represents a recommendation only — the user must confirm or reject it.
/// </summary>
public class AssignmentSuggestionDto
{
    public int WorkItemId { get; set; }
    public string WorkItemTitle { get; set; } = string.Empty;

    /// <summary>"Story" | "Task" | "Bug" — string form of WorkItemType.</summary>
    public string WorkItemType { get; set; } = string.Empty;
    public int WorkItemPoints { get; set; }
    public List<string> WorkItemTags { get; set; } = [];

    public int SuggestedMemberId { get; set; }
    public string MemberName { get; set; } = string.Empty;

    /// <summary>Avatar URL of the suggested member (may be null).</summary>
    public string? MemberAvatarUrl { get; set; }

    /// <summary>Member's explicit tags (Team settings).</summary>
    public List<string> MemberTags { get; set; } = [];

    /// <summary>
    /// Tags inferred from the member's history of completed work items.
    /// Disjoint from <see cref="MemberTags"/>.
    /// </summary>
    public List<string> MemberInferredTags { get; set; } = [];

    /// <summary>
    /// Explicit tags shared between the work item and the member — UI highlights
    /// these as full-confidence matches.
    /// </summary>
    public List<string> MatchingTags { get; set; } = [];

    /// <summary>
    /// Tags that match via the member's history (inferred). Disjoint from
    /// <see cref="MatchingTags"/>. UI typically renders these with a softer
    /// style (dashed border / lower contrast).
    /// </summary>
    public List<string> MatchingInferredTags { get; set; } = [];

    /// <summary>
    /// Confidence score expressed as a percentage (0–100).
    /// Calculated from the final score (tag match + capacity).
    /// </summary>
    public double Confidence { get; set; }

    /// <summary>
    /// Plain English fallback for the reason — kept for clients that don't
    /// translate (logs, alternate consumers).
    /// </summary>
    public string Reason { get; set; } = string.Empty;

    /// <summary>
    /// Reason expressed as an ordered list of stable codes (e.g.
    /// <c>["TAG_FULL_MATCH", "CAPACITY_HIGH"]</c>). The frontend translates
    /// each code via i18n and joins them. This is the localization contract.
    /// </summary>
    public List<string> ReasonCodes { get; set; } = [];

    /// <summary>
    /// Optional interpolation parameters for any reason code that has
    /// placeholders. Keys are template placeholders.
    /// </summary>
    public Dictionary<string, string> ReasonParams { get; set; } = [];
}
