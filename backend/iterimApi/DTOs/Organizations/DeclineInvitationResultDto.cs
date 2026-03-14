using iterimApi.Models.Enums;

namespace iterimApi.Models.DTOs.Organizations;

public class DeclineInvitationResultDto
{
    public int MemberId { get; set; }
    public int OrganizationId { get; set; }
    public int UserId { get; set; }
    public OrgMemberStatus Status { get; set; }
    public DateTime? DeclinedAt { get; set; }
}
