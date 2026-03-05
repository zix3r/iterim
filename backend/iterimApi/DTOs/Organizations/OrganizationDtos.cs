namespace iterimApi.Models.DTOs.Organizations;

public class OrganizationDto
{
	public int Id { get; set; }
	public string Name { get; set; } = string.Empty;
	public string Slug { get; set; } = string.Empty;
}

public class CreateOrganizationDto
{
	public string Name { get; set; } = string.Empty;
}

public class OrganizationDetailDto : OrganizationDto
{
	public List<OrganizationMemberDto> Members { get; set; } = [];
}

public class OrganizationMemberDto
{
	public int UserId { get; set; }
	public string Email { get; set; } = string.Empty;
	public string Role { get; set; } = string.Empty;
	public string Status { get; set; } = string.Empty;
}