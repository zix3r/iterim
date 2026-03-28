namespace iterimApi.DTOs.Iterations;

public class CompleteIterationRequestDto
{
    /// <summary>
    /// Where to move unfinished items. Null = back to backlog.
    /// Omit entirely to leave them in the completed sprint.
    /// </summary>
    public int? MoveUnfinishedToIterationId { get; set; }
}