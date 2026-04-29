namespace iterimApi.DTOs.Atpa;

/// <summary>
/// Per-member capacity breakdown produced during ATPA. Surfaced to the UI
/// so users can see why a member got more / fewer items.
/// </summary>
public class MemberCapacityDto
{
    public int MemberId { get; set; }
    public string MemberName { get; set; } = string.Empty;

    /// <summary>Profile avatar (may be null) — surfaced so the UI can render members.</summary>
    public string? AvatarUrl { get; set; }

    /// <summary>"FullTime" | "PartTime" | "Custom" — string form of the enum, easier for the FE.</summary>
    public string ScheduleType { get; set; } = "FullTime";

    public int WeeklyHours { get; set; }
    public double BaseCapacityHours { get; set; }
    public double AbsenceHours { get; set; }
    public double AlreadyAssignedHours { get; set; }
    public double AvailableCapacityHours { get; set; }
    public double VelocityAvgPoints { get; set; }

    /// <summary>Tags explicitly assigned in Team settings.</summary>
    public List<string> Tags { get; set; } = [];

    /// <summary>
    /// Tags inferred from this member's recently-completed work items.
    /// Excludes anything already in <see cref="Tags"/>. Surfaced separately
    /// so the UI can render explicit and inferred matches differently.
    /// </summary>
    public List<string> InferredTags { get; set; } = [];
}
