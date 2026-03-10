using System.ComponentModel.DataAnnotations;
using iterimApi.Models.Enums;

namespace iterimApi.DTOs.Teams;

public class AddTeamMemberDto
{
    [Required]
    public int OrgMemberId { get; set; }
    
    public TeamMemberRole Role { get; set; } = TeamMemberRole.Member;
}
