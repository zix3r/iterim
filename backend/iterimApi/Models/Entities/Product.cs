namespace iterimApi.Models.Entities;

public class Product
{
    public int Id { get; set; }
    public int OrganizationId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public int CreatedBy { get; set; }
    public int UpdatedBy { get; set; }

    // Navigation
    public Organization Organization { get; set; } = null!;
    public User CreatedByUser { get; set; } = null!;
    public User UpdatedByUser { get; set; } = null!;
    public ICollection<Team> Teams { get; set; } = [];
}