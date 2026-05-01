namespace iterimApi.DTOs.Metrics;

public class CapacityDto
{
    public DateOnly FromDate { get; set; }
    public DateOnly ToDate { get; set; }
    public int TotalWorkDays { get; set; }
    public int AbsenceDays { get; set; }
    public int AvailableDays { get; set; }
    public List<MemberCapacityItem> ByMember { get; set; } = [];
    
    public decimal TotalWorkHours { get; set; } // Visos komandos bendros valandos
    public decimal AvailableHours { get; set; } // Visos komandos likusios valandos

}

public class MemberCapacityItem
{
    public int MemberId { get; set; }
    public int UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public int WorkDays { get; set; }
    public int AbsenceDays { get; set; }
    public int AvailableDays { get; set; }
    public decimal TotalWorkHours { get; set; } // IT-111: Bendra nario norma valandomis
    public decimal AvailableHours { get; set; } // IT-111: Laisvos valandos (po absence)
}
