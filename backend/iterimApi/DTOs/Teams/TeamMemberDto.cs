using iterimApi.DTOs.Tags;

namespace iterimApi.DTOs.Teams;

public class TeamMemberDto
{
    public int Id { get; set; }
    public int TeamId { get; set; }
    public int OrgMemberId { get; set; }
    public int UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string UserEmail { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public List<TagDto> Tags { get; set; } = [];
    public int WeeklyHours { get; set; }
    public string ScheduleType { get; set; } = string.Empty;
}
