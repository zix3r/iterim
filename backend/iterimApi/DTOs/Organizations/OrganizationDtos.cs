using System.ComponentModel.DataAnnotations;

namespace iterimApi.DTOs.Organizations;

public class OrganizationDto
{
	public int Id { get; set; }
	public string Name { get; set; } = string.Empty;
	public string Slug { get; set; } = string.Empty;
}

public class CreateOrganizationDto
{
	[Required(ErrorMessage = "Organization name is required.")]
	[StringLength(100, MinimumLength = 1, ErrorMessage = "Organization name must be between 1 and 100 characters.")]
	public string Name { get; set; } = string.Empty;
}

public class OrganizationDetailDto : OrganizationDto
{
	public List<OrganizationMemberDto> Members { get; set; } = [];
	public string UserRole { get; set; } = string.Empty; // Current user's role in the organization
	public int CurrentUserId { get; set; }
}

public class OrganizationMemberDto
{
	public int Id { get; set; } // Organization Member table primary Id
	public int UserId { get; set; } // Organization User Id
	public string Email { get; set; } = string.Empty;
	public string Role { get; set; } = string.Empty;
	public string Status { get; set; } = string.Empty;
}

public class AddOrganizationMemberDto
{
	[Required(ErrorMessage = "Email is required.")]
	[EmailAddress(ErrorMessage = "Please enter a valid email address.")]
	public string Email { get; set; } = string.Empty;

	[Required(ErrorMessage = "Role is required.")]
	[RegularExpression("^(Admin|Member|Viewer)$", ErrorMessage = "Role must be Admin, Member, or Viewer.")]
	public string Role { get; set; } = "Member"; // Default to Member, can be Admin or Viewer
}