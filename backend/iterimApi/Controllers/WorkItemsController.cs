using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using iterimApi.Data;
using iterimApi.DTOs.WorkItems;
using iterimApi.Exceptions;
using iterimApi.Models.Entities;
using iterimApi.Models.Enums;
using iterimApi.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace iterimApi.Controllers;

[ApiController]
[Authorize]
public class WorkItemsController : ControllerBase
{
    private readonly IWorkItemService _workItemService;
    private readonly AppDbContext _db;

    public WorkItemsController(IWorkItemService workItemService, AppDbContext db)
    {
        _workItemService = workItemService;
        _db = db;
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
            return ValidationProblem(ModelState);
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
            return ValidationProblem(ModelState);
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
        catch (BlockedByDependenciesException ex)
        {
            return BadRequest(new { message = ex.Message, blockers = ex.Blockers });
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
    /// Partial update — assignee only.
    /// PATCH /api/workitems/:id with body { "assignedTo": int|null }.
    /// Used by the ATPA suggestions flow so the FE can apply assignments
    /// without re-sending the whole work item payload.
    /// </summary>
    [HttpPatch("api/workitems/{id}")]
    public async Task<IActionResult> AssignWorkItem(int id, [FromBody] AssignWorkItemDto dto)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        try
        {
            var userId = GetUserId();
            var workItem = await _workItemService.AssignWorkItemAsync(id, dto.AssignedTo, userId);

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
            return StatusCode(500, new { message = "An error occurred while assigning the work item", error = ex.Message });
        }
    }

    /// <summary>
    /// Transfer a work item to another team within the same organization.
    /// PATCH /api/workitems/:id/transfer
    /// </summary>
    [HttpPatch("api/workitems/{id}/transfer")]
    public async Task<IActionResult> TransferWorkItem(int id, [FromBody] TransferWorkItemDto dto)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        try
        {
            var userId = GetUserId();
            var workItem = await _workItemService.TransferWorkItemAsync(id, dto.TargetTeamId, userId);

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
            return StatusCode(500, new { message = "An error occurred while transferring the work item", error = ex.Message });
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
            return ValidationProblem(ModelState);
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
    /// Bulk import work items from a Jira CSV export.
    /// POST /api/teams/:teamId/workitems/bulk
    /// Requires team admin role.
    /// </summary>
    [HttpPost("api/teams/{teamId}/workitems/bulk")]
    public async Task<IActionResult> BulkCreateWorkItems(int teamId, [FromBody] BulkCreateWorkItemsDto dto)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        try
        {
            var userId = GetUserId();
            var count = await _workItemService.BulkCreateWorkItemsAsync(teamId, dto, userId);
            return Ok(new { importedCount = count });
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
            return StatusCode(500, new { message = "An error occurred while importing work items", error = ex.Message });
        }
    }

    /// <summary>
    /// Get all comments for a work item.
    /// GET /api/workitems/:id/comments
    /// </summary>
    [HttpGet("api/workitems/{id}/comments")]
    public async Task<IActionResult> GetComments(int id)
    {
        try
        {
            var userId = GetUserId();
            var workItem = await _db.WorkItems
                .Include(wi => wi.Team).ThenInclude(t => t.Product)
                .FirstOrDefaultAsync(wi => wi.Id == id);

            if (workItem == null)
                return NotFound(new { message = "Work item not found" });

            var isMember = await _db.OrganizationMembers
                .AnyAsync(om =>
                    om.UserId == userId &&
                    om.OrganizationId == workItem.Team.Product.OrganizationId &&
                    om.Status == OrgMemberStatus.Active);

            if (!isMember)
                return StatusCode(403, new { message = "You are not a member of this organization" });

            var comments = await _db.WorkItemComments
                .Where(c => c.WorkItemId == id && c.ParentCommentId == null)
                .Include(c => c.Author).ThenInclude(om => om.User)
                .OrderBy(c => c.CreatedAt)
                .Select(c => new WorkItemCommentDto
                {
                    Id = c.Id,
                    WorkItemId = c.WorkItemId,
                    AuthorId = c.AuthorId,
                    AuthorUserId = c.Author.UserId,
                    AuthorName = c.Author.User.Name,
                    AuthorAvatarUrl = c.Author.User.AvatarUrl,
                    Content = c.Message,
                    CreatedAt = c.CreatedAt,
                    UpdatedAt = c.UpdatedAt,
                })
                .ToListAsync();

            return Ok(comments);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred while retrieving comments", error = ex.Message });
        }
    }

    /// <summary>
    /// Add a comment to a work item.
    /// POST /api/workitems/:id/comments
    /// </summary>
    [HttpPost("api/workitems/{id}/comments")]
    public async Task<IActionResult> AddComment(int id, [FromBody] CreateWorkItemCommentDto dto)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        try
        {
            var userId = GetUserId();
            var workItem = await _db.WorkItems
                .Include(wi => wi.Team).ThenInclude(t => t.Product)
                .FirstOrDefaultAsync(wi => wi.Id == id);

            if (workItem == null)
                return NotFound(new { message = "Work item not found" });

            var author = await _db.OrganizationMembers
                .Include(om => om.User)
                .FirstOrDefaultAsync(om =>
                    om.UserId == userId &&
                    om.OrganizationId == workItem.Team.Product.OrganizationId &&
                    om.Status == OrgMemberStatus.Active);

            if (author == null)
                return StatusCode(403, new { message = "You are not a member of this organization" });

            var now = DateTime.UtcNow;
            var comment = new WorkItemComment
            {
                WorkItemId = id,
                AuthorId = author.Id,
                Message = dto.Content.Trim(),
                CreatedAt = now,
                UpdatedAt = now,
            };

            _db.WorkItemComments.Add(comment);
            await _db.SaveChangesAsync();

            return CreatedAtAction(nameof(GetComments), new { id }, new WorkItemCommentDto
            {
                Id = comment.Id,
                WorkItemId = comment.WorkItemId,
                AuthorId = comment.AuthorId,
                AuthorUserId = author.UserId,
                AuthorName = author.User.Name,
                AuthorAvatarUrl = author.User.AvatarUrl,
                Content = comment.Message,
                CreatedAt = comment.CreatedAt,
                UpdatedAt = comment.UpdatedAt,
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred while adding the comment", error = ex.Message });
        }
    }

    /// <summary>
    /// Edit a comment (only the author can edit).
    /// PUT /api/workitems/:id/comments/:commentId
    /// </summary>
    [HttpPut("api/workitems/{id}/comments/{commentId}")]
    public async Task<IActionResult> EditComment(int id, int commentId, [FromBody] UpdateWorkItemCommentDto dto)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        try
        {
            var userId = GetUserId();
            var comment = await _db.WorkItemComments
                .Include(c => c.Author).ThenInclude(om => om.User)
                .FirstOrDefaultAsync(c => c.Id == commentId && c.WorkItemId == id);

            if (comment == null)
                return NotFound(new { message = "Comment not found" });

            if (comment.Author.UserId != userId)
                return StatusCode(403, new { message = "Only the author can edit this comment" });

            comment.Message = dto.Content.Trim();
            comment.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            return Ok(new WorkItemCommentDto
            {
                Id = comment.Id,
                WorkItemId = comment.WorkItemId,
                AuthorId = comment.AuthorId,
                AuthorUserId = comment.Author.UserId,
                AuthorName = comment.Author.User.Name,
                AuthorAvatarUrl = comment.Author.User.AvatarUrl,
                Content = comment.Message,
                CreatedAt = comment.CreatedAt,
                UpdatedAt = comment.UpdatedAt,
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred while editing the comment", error = ex.Message });
        }
    }

    /// <summary>
    /// Delete a comment (author or org admin).
    /// DELETE /api/workitems/:id/comments/:commentId
    /// </summary>
    [HttpDelete("api/workitems/{id}/comments/{commentId}")]
    public async Task<IActionResult> DeleteComment(int id, int commentId)
    {
        try
        {
            var userId = GetUserId();
            var comment = await _db.WorkItemComments
                .Include(c => c.WorkItem).ThenInclude(wi => wi.Team).ThenInclude(t => t.Product)
                .Include(c => c.Author)
                .FirstOrDefaultAsync(c => c.Id == commentId && c.WorkItemId == id);

            if (comment == null)
                return NotFound(new { message = "Comment not found" });

            var isAuthor = comment.Author.UserId == userId;

            if (!isAuthor)
            {
                var isTeamLeader = await _db.TeamMembers
                    .AnyAsync(tm =>
                        tm.TeamId == comment.WorkItem.TeamId &&
                        tm.OrgMember.UserId == userId &&
                        tm.Role == TeamMemberRole.Admin);

                if (!isTeamLeader)
                    return StatusCode(403, new { message = "Only the author or a team leader can delete this comment" });
            }

            _db.WorkItemComments.Remove(comment);
            await _db.SaveChangesAsync();

            return Ok(new { message = "Comment deleted successfully" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred while deleting the comment", error = ex.Message });
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
