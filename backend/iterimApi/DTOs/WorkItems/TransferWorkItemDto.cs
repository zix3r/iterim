using System.ComponentModel.DataAnnotations;

namespace iterimApi.DTOs.WorkItems;

public class TransferWorkItemDto
{
    [Range(1, int.MaxValue, ErrorMessage = "Target team must be a valid team.")]
    public int TargetTeamId { get; set; }
}