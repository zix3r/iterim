using iterimApi.Models.Enums;

namespace iterimApi.Models.DTOs.Organizations;

public class PendingInvitationDto
{
    public int OrganizationId { get; set; }
    public string OrganizationName { get; set; } = string.Empty;
    public string OrganizationSlug { get; set; } = string.Empty;
    public OrgMemberRole Role { get; set; }
    public DateTime? InvitedAt { get; set; }
}
