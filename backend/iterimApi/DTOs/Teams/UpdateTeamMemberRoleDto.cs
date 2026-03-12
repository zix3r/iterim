using System.ComponentModel.DataAnnotations;
using iterimApi.Models.Enums;

namespace iterimApi.DTOs.Teams;

public class UpdateTeamMemberRoleDto
{
    [Required]
    public TeamMemberRole Role { get; set; }
}
