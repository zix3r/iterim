using System.ComponentModel.DataAnnotations;

namespace iterimApi.DTOs.Iterations;

public class CreateIterationDto
{
    [MaxLength(255)]
    public string? Name { get; set; }

    /// <summary>
    /// Optional. If omitted, defaults to today.
    /// </summary>
    public DateOnly? StartDate { get; set; }

    /// <summary>
    /// Optional. If omitted, defaults to StartDate + OrganizationConfig.IterationLengthDays.
    /// </summary>
    public DateOnly? EndDate { get; set; }

    public string? Goal { get; set; }
}
