using iterimApi.Models.Enums;

namespace iterimApi.Models.Entities;

public class TeamMember
{
    public int Id { get; set; }
    public int TeamId { get; set; }
    public int OrgMemberId { get; set; }
    public TeamMemberRole Role { get; set; } = TeamMemberRole.Member;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public int CreatedBy { get; set; }
    public int UpdatedBy { get; set; }
    public int WeeklyHours { get; set; } = 40;
    public WorkScheduleType ScheduleType { get; set; } = WorkScheduleType.FullTime;

    // Navigation
    public Team Team { get; set; } = null!;
    public OrganizationMember OrgMember { get; set; } = null!;
    public User CreatedByUser { get; set; } = null!;
    public User UpdatedByUser { get; set; } = null!;
    public ICollection<WorkItem> AssignedWorkItems { get; set; } = [];
    public ICollection<TeamMemberTag> Tags { get; set; } = [];
}