using System.ComponentModel.DataAnnotations;

namespace iterimApi.DTOs.Iterations;

public class CreateIterationDto : IValidatableObject
{
    [MaxLength(255, ErrorMessage = "Name cannot exceed 255 characters.")]
    public string? Name { get; set; }

    /// <summary>
    /// Optional. If omitted, defaults to today.
    /// </summary>
    public DateOnly? StartDate { get; set; }

    /// <summary>
    /// Optional. If omitted, defaults to StartDate + OrganizationConfig.IterationLengthDays.
    /// </summary>
    public DateOnly? EndDate { get; set; }

    [MaxLength(1000, ErrorMessage = "Goal cannot exceed 1000 characters.")]
    public string? Goal { get; set; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (StartDate.HasValue && EndDate.HasValue && EndDate.Value < StartDate.Value)
        {
            yield return new ValidationResult(
                "End date must be on or after start date.",
                [nameof(EndDate)]
            );
        }
    }
}
