namespace iterimApi.DTOs.Tags;

public class TagDto
{
    public int Id { get; set; }
    public int OrganizationId { get; set; }
    public string Name { get; set; } = "";
    public string Color { get; set; } = "";
    public DateTime CreatedAt { get; set; }
}
