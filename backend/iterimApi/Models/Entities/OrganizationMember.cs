using iterimApi.Models.Enums;

namespace iterimApi.Models.Entities;

public class OrganizationMember
{
    public int Id { get; set; }
    public int OrganizationId { get; set; }
    public int UserId { get; set; }
    public string Email { get; set; } = string.Empty;
    public OrgMemberRole Role { get; set; } = OrgMemberRole.Member;
    public OrgMemberStatus Status { get; set; } = OrgMemberStatus.Invited;
    public DateTime? InvitedAt { get; set; }
    public DateTime? JoinedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public int? InvitedBy { get; set; }
    public int? UpdatedByUserId { get; set; }

    // Navigation
    public Organization Organization { get; set; } = null!;
    public User User { get; set; } = null!;
    public User? InvitedByUser { get; set; }
    public User? UpdatedByUser { get; set; }
    public ICollection<TeamMember> TeamMemberships { get; set; } = [];
    public ICollection<MemberAbsence> Absences { get; set; } = [];
    public ICollection<WorkItemComment> Comments { get; set; } = [];
    public ICollection<WorkItemHistory> HistoryChanges { get; set; } = [];
}