using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using iterimApi.DTOs.Tags;
using iterimApi.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace iterimApi.Controllers;

[ApiController]
[Authorize]
public class TagsController : ControllerBase
{
    private readonly ITagService _tagService;

    public TagsController(ITagService tagService)
    {
        _tagService = tagService;
    }

    /// <summary>
    /// Get all tags for an organization
    /// </summary>
    [HttpGet("api/organizations/{orgId}/tags")]
    public async Task<IActionResult> GetOrgTags(int orgId)
    {
        try
        {
            var userId = GetUserId();
            var tags = await _tagService.GetOrgTagsAsync(orgId, userId);
            return Ok(tags);
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
            return StatusCode(500, new { message = "An error occurred while retrieving tags", error = ex.Message });
        }
    }

    /// <summary>
    /// Create a new tag for an organization (Admin only)
    /// </summary>
    [HttpPost("api/organizations/{orgId}/tags")]
    public async Task<IActionResult> CreateTag(int orgId, [FromBody] CreateTagDto dto)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        try
        {
            var userId = GetUserId();
            var tag = await _tagService.CreateTagAsync(orgId, dto, userId);
            return StatusCode(201, tag);
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
            return StatusCode(500, new { message = "An error occurred while creating the tag", error = ex.Message });
        }
    }

    /// <summary>
    /// Delete a tag from an organization (Admin only)
    /// </summary>
    [HttpDelete("api/organizations/{orgId}/tags/{tagId}")]
    public async Task<IActionResult> DeleteTag(int orgId, int tagId)
    {
        try
        {
            var userId = GetUserId();
            var result = await _tagService.DeleteTagAsync(orgId, tagId, userId);

            if (!result)
                return NotFound(new { message = "Tag not found" });

            return Ok(new { message = "Tag deleted successfully" });
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
            return StatusCode(500, new { message = "An error occurred while deleting the tag", error = ex.Message });
        }
    }

    /// <summary>
    /// Assign tags to a work item (replaces all existing tags)
    /// </summary>
    [HttpPut("api/workitems/{id}/tags")]
    public async Task<IActionResult> AssignWorkItemTags(int id, [FromBody] AssignTagsDto dto)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        try
        {
            var userId = GetUserId();
            var tags = await _tagService.AssignTagsToWorkItemAsync(id, dto, userId);
            return Ok(tags);
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
            return StatusCode(500, new { message = "An error occurred while assigning tags to work item", error = ex.Message });
        }
    }

    /// <summary>
    /// Assign tags to a team member (Team Admin or Org Admin only)
    /// </summary>
    [HttpPut("api/teams/{teamId}/members/{memberId}/tags")]
    public async Task<IActionResult> AssignTeamMemberTags(int teamId, int memberId, [FromBody] AssignTagsDto dto)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        try
        {
            var userId = GetUserId();
            var tags = await _tagService.AssignTagsToTeamMemberAsync(teamId, memberId, dto, userId);
            return Ok(tags);
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
            return StatusCode(500, new { message = "An error occurred while assigning tags to team member", error = ex.Message });
        }
    }

    private int GetUserId()
    {
        var userIdClaim = User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
                         ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
            throw new UnauthorizedAccessException("Invalid user authentication");

        return userId;
    }
}
