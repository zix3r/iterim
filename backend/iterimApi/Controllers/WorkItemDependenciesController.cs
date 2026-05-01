using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using iterimApi.DTOs.WorkItems;
using iterimApi.Exceptions;
using iterimApi.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace iterimApi.Controllers;

[ApiController]
[Authorize]
public class WorkItemDependenciesController : ControllerBase
{
    private readonly IWorkItemDependencyService _dependencyService;

    public WorkItemDependenciesController(IWorkItemDependencyService dependencyService)
    {
        _dependencyService = dependencyService;
    }

    /// <summary>
    /// GET /api/workitems/:id/dependencies
    /// Returns { blocks: [...], blockedBy: [...] }
    /// </summary>
    [HttpGet("api/workitems/{id}/dependencies")]
    public async Task<IActionResult> GetDependencies(int id)
    {
        try
        {
            var userId = GetUserId();
            var deps = await _dependencyService.GetDependenciesAsync(id, userId);
            return Ok(deps);
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
            return StatusCode(500, new { message = "An error occurred", error = ex.Message });
        }
    }

    /// <summary>
    /// POST /api/workitems/:id/dependencies
    /// Body: { blockedByWorkItemId: number }
    /// Adds blockedByWorkItemId as a blocker of work item :id
    /// </summary>
    [HttpPost("api/workitems/{id}/dependencies")]
    public async Task<IActionResult> AddDependency(int id, [FromBody] CreateDependencyDto dto)
    {
        try
        {
            var userId = GetUserId();
            var dep = await _dependencyService.AddDependencyAsync(id, dto.BlockedByWorkItemId, userId);
            return Ok(dep);
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
            return StatusCode(500, new { message = "An error occurred", error = ex.Message });
        }
    }

    /// <summary>
    /// DELETE /api/workitems/:id/dependencies/:dependencyId
    /// Removes one specific dependency.
    /// </summary>
    [HttpDelete("api/workitems/{id}/dependencies/{dependencyId}")]
    public async Task<IActionResult> RemoveDependency(int id, int dependencyId)
    {
        try
        {
            var userId = GetUserId();
            await _dependencyService.RemoveDependencyAsync(dependencyId, userId);
            return Ok(new { message = "Dependency removed" });
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
            return StatusCode(500, new { message = "An error occurred", error = ex.Message });
        }
    }

    /// <summary>
    /// GET /api/workitems/search?q=...
    /// Search work items across all teams the user is a member of.
    /// </summary>
    [HttpGet("api/workitems/search")]
    public async Task<IActionResult> SearchWorkItems([FromQuery] string q = "")
    {
        try
        {
            var userId = GetUserId();
            var results = await _dependencyService.SearchWorkItemsAsync(q, userId);
            return Ok(results);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred", error = ex.Message });
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
