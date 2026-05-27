using System.ComponentModel.DataAnnotations;
using iterimApi.Models.Enums;

namespace iterimApi.DTOs.MemberAbsences;

public class CreateMemberAbsenceDto : IValidatableObject
{
    [Range(1, int.MaxValue, ErrorMessage = "A valid member must be selected.")]
    public int OrgMemberId { get; set; }

    public DateOnly FromDate { get; set; }

    public DateOnly ToDate { get; set; }

    public TimeOnly? FromTime { get; set; }

    public TimeOnly? ToTime { get; set; }

    public AbsenceReason Reason { get; set; }

    [MaxLength(500, ErrorMessage = "Reason details cannot exceed 500 characters.")]
    public string? OtherReason { get; set; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (FromDate == default)
        {
            yield return new ValidationResult(
                "From date is required.",
                [nameof(FromDate)]
            );
        }

        if (ToDate == default)
        {
            yield return new ValidationResult(
                "To date is required.",
                [nameof(ToDate)]
            );
        }

        if (FromDate != default && ToDate != default && ToDate < FromDate)
        {
            yield return new ValidationResult(
                "To date must be on or after from date.",
                [nameof(ToDate)]
            );
        }

        if (FromDate == ToDate && FromTime.HasValue && ToTime.HasValue && ToTime.Value < FromTime.Value)
        {
            yield return new ValidationResult(
                "To time must be on or after from time when on the same day.",
                [nameof(ToTime)]
            );
        }

        if (Reason == AbsenceReason.Other && string.IsNullOrWhiteSpace(OtherReason))
        {
            yield return new ValidationResult(
                "Reason details are required when reason is Other.",
                [nameof(OtherReason)]
            );
        }
    }
}
