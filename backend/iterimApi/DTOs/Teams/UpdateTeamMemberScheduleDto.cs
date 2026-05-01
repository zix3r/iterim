using System.ComponentModel.DataAnnotations;

namespace iterimApi.DTOs.Teams;

public class UpdateTeamMemberScheduleDto
{
    [Required]
    public string ScheduleType { get; set; } = string.Empty;

    [Range(1, 80, ErrorMessage = "Weekly hours must be between 1 and 80.")]
    public int WeeklyHours { get; set; }
}