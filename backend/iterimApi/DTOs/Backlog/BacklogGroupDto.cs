namespace iterimApi.DTOs.WorkItems;

/// <summary>
/// Work items grouped by iteration (sprint).
/// IterationId == null means "Backlog" (unplanned items).
/// </summary>
public class BacklogGroupDto
{
    public int? IterationId { get; set; }
    public string? IterationName { get; set; }
    public string? IterationStatus { get; set; }
    public List<WorkItemDto> WorkItems { get; set; } = [];
}
