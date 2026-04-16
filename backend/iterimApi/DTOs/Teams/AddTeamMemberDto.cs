using System.ComponentModel.DataAnnotations;
using iterimApi.Models.Enums;

namespace iterimApi.DTOs.Teams;

public class AddTeamMemberDto
{
    [Range(1, int.MaxValue, ErrorMessage = "A valid organization member must be selected.")]
    public int OrgMemberId { get; set; }
    
    public TeamMemberRole Role { get; set; } = TeamMemberRole.Member;
}
