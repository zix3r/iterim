namespace iterimApi.DTOs.Atpa;

/// <summary>
/// Top-level response from the ATPA endpoint.
/// </summary>
public class SuggestAssignmentsResponseDto
{
    public int IterationId { get; set; }
    public int TeamId { get; set; }

    /// <summary>
    /// Per-work-item suggested assignment (only recommendations, must be confirmed).
    /// </summary>
    public List<AssignmentSuggestionDto> Suggestions { get; set; } = [];

    /// <summary>
    /// Warnings / info messages (overload, missing tags, ...).
    /// </summary>
    public List<AtpaWarningDto> Warnings { get; set; } = [];

    /// <summary>
    /// Items the algorithm could not assign at all.
    /// </summary>
    public List<UnassignedItemDto> Unassigned { get; set; } = [];

    /// <summary>
    /// Per-member capacity summary (debug / UI display).
    /// </summary>
    public List<MemberCapacityDto> MemberCapacities { get; set; } = [];
}
