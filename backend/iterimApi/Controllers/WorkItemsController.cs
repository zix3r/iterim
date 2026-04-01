using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using iterimApi.DTOs.WorkItems;
using iterimApi.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace iterimApi.Controllers;

[ApiController]
[Authorize]
public class WorkItemsController : ControllerBase
{
    private readonly IWorkItemService _workItemService;

    public WorkItemsController(IWorkItemService workItemService)
    {
        _workItemService = workItemService;
    }

    /// <summary>
    /// Get all work items for a team with optional filters.
    /// GET /api/teams/:teamId/workitems?type=Bug&status=InProgress&assignedTo=5&iterationId=3
    /// Use iterationId=0 to get only backlog items (not assigned to any sprint).
    /// </summary>
    [HttpGet("api/teams/{teamId}/workitems")]
    public async Task<IActionResult> GetWorkItemsByTeam(int teamId, [FromQuery] WorkItemFilterDto filters)
    {
        try
        {
            var userId = GetUserId();
            var workItems = await _workItemService.GetWorkItemsByTeamAsync(teamId, filters, userId);
            return Ok(workItems);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred while retrieving work items", error = ex.Message });
        }
    }

    /// <summary>
    /// Get work items grouped by iteration (sprint).
    /// GET /api/teams/:teamId/workitems/grouped
    /// Returns backlog group first, then each iteration's items.
    /// </summary>
    [HttpGet("api/teams/{teamId}/workitems/grouped")]
    public async Task<IActionResult> GetWorkItemsGrouped(int teamId)
    {
        try
        {
            var userId = GetUserId();
            var groups = await _workItemService.GetBacklogGroupedByIterationAsync(teamId, userId);
            return Ok(groups);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred while retrieving grouped work items", error = ex.Message });
        }
    }

    /// <summary>
    /// Get a single work item by ID.
    /// GET /api/workitems/:id
    /// </summary>
    [HttpGet("api/workitems/{id}")]
    public async Task<IActionResult> GetWorkItemById(int id)
    {
        try
        {
            var userId = GetUserId();
            var workItem = await _workItemService.GetWorkItemByIdAsync(id, userId);

            if (workItem == null)
            {
                return NotFound(new { message = "Work item not found" });
            }

            return Ok(workItem);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred while retrieving the work item", error = ex.Message });
        }
    }

    /// <summary>
    /// Create a new work item in a team's backlog.
    /// POST /api/teams/:teamId/workitems
    /// </summary>
    [HttpPost("api/teams/{teamId}/workitems")]
    public async Task<IActionResult> CreateWorkItem(int teamId, [FromBody] CreateWorkItemDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            var userId = GetUserId();
            var workItem = await _workItemService.CreateWorkItemAsync(teamId, dto, userId);

            if (workItem == null)
            {
                return BadRequest(new { message = "Failed to create work item" });
            }

            return CreatedAtAction(
                nameof(GetWorkItemById),
                new { id = workItem.Id },
                workItem
            );
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred while creating the work item", error = ex.Message });
        }
    }

    /// <summary>
    /// Update a work item (title, description, priority, points, status, assignee, sprint).
    /// PUT /api/workitems/:id
    /// Set iterationId to assign/remove from sprint. Set assignedTo to assign/unassign.
    /// </summary>
    [HttpPut("api/workitems/{id}")]
    public async Task<IActionResult> UpdateWorkItem(int id, [FromBody] UpdateWorkItemDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            var userId = GetUserId();
            var workItem = await _workItemService.UpdateWorkItemAsync(id, dto, userId);

            if (workItem == null)
            {
                return NotFound(new { message = "Work item not found" });
            }

            return Ok(workItem);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred while updating the work item", error = ex.Message });
        }
    }

    /// <summary>
    /// Delete a work item.
    /// DELETE /api/workitems/:id
    /// </summary>
    [HttpDelete("api/workitems/{id}")]
    public async Task<IActionResult> DeleteWorkItem(int id)
    {
        try
        {
            var userId = GetUserId();
            var result = await _workItemService.DeleteWorkItemAsync(id, userId);

            if (!result)
            {
                return NotFound(new { message = "Work item not found" });
            }

            return Ok(new { message = "Work item deleted successfully" });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred while deleting the work item", error = ex.Message });
        }
    }
    /// <summary>
    /// Reorder work items within an iteration or backlog.
    /// PATCH /api/teams/:teamId/workitems/reorder
    /// </summary>
    [HttpPatch("api/teams/{teamId}/workitems/reorder")]
    public async Task<IActionResult> ReorderWorkItems(int teamId, [FromBody] ReorderWorkItemsDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            var userId = GetUserId();
            await _workItemService.ReorderWorkItemsAsync(teamId, dto, userId);
            return Ok(new { message = "Reorder successful" });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred while reordering", error = ex.Message });
        }
    }

    /// <summary>
    /// Helper method to extract user ID from JWT claims
    /// </summary>
    private int GetUserId()
    {
        var userIdClaim = User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
                         ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
        {
            throw new UnauthorizedAccessException("Invalid user authentication");
        }

        return userId;
    }
}
