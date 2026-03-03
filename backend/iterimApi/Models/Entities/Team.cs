using Microsoft.VisualBasic;

namespace iterimApi.Models.Entities;

public class Team
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public int CreatedBy { get; set; }
    public int UpdatedBy { get; set; }

    // Navigation
    public Product Product { get; set; } = null!;
    public User CreatedByUser { get; set; } = null!;
    public User UpdatedByUser { get; set; } = null!;
    public ICollection<TeamMember> Members { get; set; } = [];
    public ICollection<Iteration> Iterations { get; set; } = [];
    public ICollection<WorkItem> WorkItems { get; set; } = [];
}