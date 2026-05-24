namespace iterimApi.DTOs.MemberAbsences;

public class MemberAbsenceDto
{
    public int Id { get; set; }
    public int OrgMemberId { get; set; }
    public string MemberName { get; set; } = string.Empty;
    public DateOnly FromDate { get; set; }
    public DateOnly ToDate { get; set; }
    public TimeOnly? FromTime { get; set; }
    public TimeOnly? ToTime { get; set; }
    public string Reason { get; set; } = string.Empty;
    public string? ReasonDetails { get; set; }
}
