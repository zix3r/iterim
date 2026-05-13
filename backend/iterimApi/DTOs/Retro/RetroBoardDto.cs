namespace iterimApi.DTOs.Retro;

/// <summary>
/// Snapshot of a retrospective board for one iteration. The FE renders three
/// columns from <see cref="Items"/> grouped by <see cref="RetroItemDto.Column"/>.
/// </summary>
public class RetroBoardDto
{
    public int IterationId { get; set; }
    public int TeamId { get; set; }
    public string? IterationName { get; set; }

    /// <summary>"Planning" | "Active" | "Completed".</summary>
    public string IterationStatus { get; set; } = string.Empty;

    /// <summary>True when the iteration is Completed — FE must hide add / edit / delete / vote controls.</summary>
    public bool IsReadOnly { get; set; }

    public List<RetroItemDto> Items { get; set; } = new();
}
