namespace iterimApi.Models.Entities;

public class Tag
{
    public int Id { get; set; }
    public int OrganizationId { get; set; }
    public string Name { get; set; } = "";
    public string Color { get; set; } = "#6366f1";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public Organization Organization { get; set; } = null!;
    public ICollection<WorkItemTag> WorkItemTags { get; set; } = [];
    public ICollection<TeamMemberTag> TeamMemberTags { get; set; } = [];
}
