using iterimApi.Models.Enums;

namespace iterimApi.Models.DTOs.Organizations;

public class AcceptInvitationResultDto
{
    public int MemberId { get; set; }
    public int OrganizationId { get; set; }
    public int UserId { get; set; }
    public string Email { get; set; } = string.Empty;
    public OrgMemberRole Role { get; set; }
    public OrgMemberStatus Status { get; set; }
    public DateTime? JoinedAt { get; set; }
}
