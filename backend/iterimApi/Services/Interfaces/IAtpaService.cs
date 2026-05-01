using iterimApi.DTOs.Atpa;

namespace iterimApi.Services.Interfaces;

/// <summary>
/// ATPA — Automatiškas Task'ų Priskyrimo Algoritmas.
/// Suggests an optimal distribution of work items to team members based on
/// weekly hours, tag matching, velocity history, absences and current load.
/// Returns recommendations only — the user must confirm or reject them.
/// </summary>
public interface IAtpaService
{
    /// <summary>
    /// Suggest assignments for all unassigned work items in the given iteration.
    /// </summary>
    /// <param name="iterationId">The iteration to plan.</param>
    /// <param name="userId">The authenticated user (must be a team member).</param>
    Task<SuggestAssignmentsResponseDto> SuggestAssignmentsAsync(int iterationId, int userId);
}
