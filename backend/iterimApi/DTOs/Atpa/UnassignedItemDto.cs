namespace iterimApi.DTOs.Atpa;

/// <summary>
/// A work item that the ATPA algorithm could not assign to any member
/// (e.g. all members overloaded, SP exceeds every member's capacity).
/// </summary>
public class UnassignedItemDto
{
    public int WorkItemId { get; set; }
    public string WorkItemTitle { get; set; } = string.Empty;
    public int WorkItemPoints { get; set; }
    public List<string> WorkItemTags { get; set; } = [];
    public string Reason { get; set; } = string.Empty;
}
