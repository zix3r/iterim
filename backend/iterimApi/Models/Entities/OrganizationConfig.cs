namespace iterimApi.Models.Entities;

public class OrganizationConfig
{
    public int Id { get; set; }
    public int OrganizationId { get; set; }
    public string DefaultPointsScale { get; set; } = "fibonacci";
    public int IterationLengthDays { get; set; } = 14;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public Organization Organization { get; set; } = null!;
}