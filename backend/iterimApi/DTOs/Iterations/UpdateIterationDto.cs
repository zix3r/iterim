using System.ComponentModel.DataAnnotations;

namespace iterimApi.DTOs.Iterations;

public class UpdateIterationDto : IValidatableObject
{
    [MaxLength(255, ErrorMessage = "Name cannot exceed 255 characters.")]
    public string? Name { get; set; }

    public DateOnly StartDate { get; set; }

    public DateOnly EndDate { get; set; }

    [MaxLength(1000, ErrorMessage = "Goal cannot exceed 1000 characters.")]
    public string? Goal { get; set; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (StartDate == default)
        {
            yield return new ValidationResult(
                "Start date is required.",
                [nameof(StartDate)]
            );
        }

        if (EndDate == default)
        {
            yield return new ValidationResult(
                "End date is required.",
                [nameof(EndDate)]
            );
        }

        if (StartDate != default && EndDate != default && EndDate < StartDate)
        {
            yield return new ValidationResult(
                "End date must be on or after start date.",
                [nameof(EndDate)]
            );
        }
    }
}
