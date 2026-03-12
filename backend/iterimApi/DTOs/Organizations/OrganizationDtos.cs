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
	public string UserRole { get; set; } = string.Empty; // Current user's role in the organization
}

public class OrganizationMemberDto
{
	public int Id { get; set; } // Organization Member table primary Id
	public int UserId { get; set; } // Organization User Id
	public string Email { get; set; } = string.Empty;
	public string Role { get; set; } = string.Empty;
	public string Status { get; set; } = string.Empty;
}