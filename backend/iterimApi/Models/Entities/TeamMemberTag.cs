namespace iterimApi.Models.Entities;

public class TeamMemberTag
{
    public int TeamMemberId { get; set; }
    public int TagId { get; set; }

    // Navigation
    public TeamMember TeamMember { get; set; } = null!;
    public Tag Tag { get; set; } = null!;
}
