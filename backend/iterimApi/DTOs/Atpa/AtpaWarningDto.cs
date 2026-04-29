namespace iterimApi.DTOs.Atpa;

/// <summary>
/// Warning or info message produced by the ATPA algorithm.
/// </summary>
public class AtpaWarningDto
{
    /// <summary>
    /// "warning" or "info".
    /// </summary>
    public string Severity { get; set; } = "warning";

    public string Code { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;

    /// <summary>
    /// Optional related entity id (work item or member), depending on the message.
    /// </summary>
    public int? RelatedEntityId { get; set; }
}
