namespace iterimApi.DTOs.Atpa;

/// <summary>
/// Per-member capacity breakdown produced during ATPA. Surfaced to the UI
/// so users can see why a member got more / fewer items.
/// </summary>
public class MemberCapacityDto
{
    public int MemberId { get; set; }
    public string MemberName { get; set; } = string.Empty;
    public int WeeklyHours { get; set; }
    public double BaseCapacityHours { get; set; }
    public double AbsenceHours { get; set; }
    public double AlreadyAssignedHours { get; set; }
    public double AvailableCapacityHours { get; set; }
    public double VelocityAvgPoints { get; set; }
    public List<string> Tags { get; set; } = [];
}
