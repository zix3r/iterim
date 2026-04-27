namespace iterimApi.DTOs.Admin;

public class AdminOrganizationListDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public int MemberCount { get; set; }
    public int ProductCount { get; set; }
    public int TeamCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? LastActivityAt { get; set; }
}

public class AdminOrganizationDetailDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public List<AdminOrgMemberDto> Members { get; set; } = new();
    public List<AdminOrgProductDto> Products { get; set; } = new();
}

public class AdminOrgMemberDto
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
}

public class AdminOrgProductDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int TeamCount { get; set; }
    public List<AdminOrgTeamDto> Teams { get; set; } = new();
}

public class AdminOrgTeamDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
}