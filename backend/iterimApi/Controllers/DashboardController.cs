using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using iterimApi.DTOs.Dashboard;
using iterimApi.Services.Interfaces;

namespace iterimApi.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class DashboardController : ControllerBase
{
    private readonly IDashboardService _dashboardService;

    public DashboardController(IDashboardService dashboardService)
    {
        _dashboardService = dashboardService;
    }

    [HttpGet]
    public async Task<ActionResult<DashboardDto>> GetDashboard()
    {
        var userId = GetUserId();
        var dashboard = await _dashboardService.GetDashboardAsync(userId);
        return Ok(dashboard);
    }

    private int GetUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (claim != null && int.TryParse(claim.Value, out int userId))
        {
            return userId;
        }
        // Fallback or throw
        throw new UnauthorizedAccessException("User ID not found in token.");
    }
}
