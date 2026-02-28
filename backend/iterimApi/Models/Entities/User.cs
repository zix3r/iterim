using iterimApi.Models.Enums;

namespace iterimApi.Models.Entities;

public class User
{
    public int Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public UserRole Role { get; set; } = UserRole.User;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public ICollection<RefreshToken> RefreshTokens { get; set; } = [];
    public ICollection<OrganizationMember> OrganizationMemberships { get; set; } = [];
}