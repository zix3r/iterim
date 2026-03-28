using System.ComponentModel.DataAnnotations;
using iterimApi.Models.Enums;

namespace iterimApi.DTOs.MemberAbsences;

public class CreateMemberAbsenceDto
{
    public int OrgMemberId { get; set; }
    public DateOnly FromDate { get; set; }
    public DateOnly ToDate { get; set; }
    public AbsenceReason Reason { get; set; }

    [MaxLength(500)]
    public string? OtherReason { get; set; }
}
