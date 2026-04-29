using System.ComponentModel.DataAnnotations;

namespace iterimApi.DTOs.WorkItems;

/// <summary>
/// Body for PATCH /api/workitems/:id/assignee.
/// Set AssignedTo to a TeamMember.Id to assign, or null to unassign.
/// </summary>
public class AssignWorkItemDto
{
    /// <summary>
    /// TeamMember.Id (not User.Id). Null = unassign.
    /// </summary>
    [Range(1, int.MaxValue, ErrorMessage = "Assignee must be a valid team member.")]
    public int? AssignedTo { get; set; }
}
