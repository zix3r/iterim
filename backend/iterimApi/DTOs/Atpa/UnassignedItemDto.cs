namespace iterimApi.DTOs.Atpa;

/// <summary>
/// A work item that the ATPA algorithm could not assign to any member
/// (e.g. all members overloaded, SP exceeds every member's capacity).
///
/// Localization contract: <see cref="ReasonCode"/> + <see cref="ReasonParams"/>
/// is the i18n contract; <see cref="Reason"/> is a plain English fallback.
/// </summary>
public class UnassignedItemDto
{
    public int WorkItemId { get; set; }
    public string WorkItemTitle { get; set; } = string.Empty;
    public int WorkItemPoints { get; set; }
    public List<string> WorkItemTags { get; set; } = [];

    /// <summary>Plain English fallback.</summary>
    public string Reason { get; set; } = string.Empty;

    /// <summary>Stable code — used as i18n key (e.g. <c>UNASSIGNED_ALL_FULL</c>).</summary>
    public string ReasonCode { get; set; } = string.Empty;

    /// <summary>Interpolation parameters for the localized reason template.</summary>
    public Dictionary<string, string> ReasonParams { get; set; } = [];
}
