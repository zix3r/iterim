using System.ComponentModel.DataAnnotations;

namespace iterimApi.DTOs.Iterations;

public class UpdateIterationDto
{
    [MaxLength(255)]
    public string? Name { get; set; }

    public DateOnly StartDate { get; set; }

    public DateOnly EndDate { get; set; }

    public string? Goal { get; set; }
}
