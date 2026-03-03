namespace iterimApi.Models.Entities;

public class Organization
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public int CreatedBy { get; set; }
    public int UpdatedBy { get; set; }

    // Navigation
    public User CreatedByUser { get; set; } = null!;
    public User UpdatedByUser { get; set; } = null!;
    public ICollection<OrganizationMember> Members { get; set; } = [];
    public ICollection<Product> Products { get; set; } = [];
    public OrganizationConfig? Config { get; set; }
}