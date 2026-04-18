using iterimApi.Data;
using iterimApi.DTOs.Admin;
using iterimApi.Services.Interfaces;
using iterimApi.Models.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace iterimApi.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IAuthService _authService;

    public AdminController(AppDbContext db, IAuthService authService)
    {
        _db = db;
        _authService = authService;
    }

    /// <summary>
    /// GET /api/admin/users?search=rom&status=blocked&page=1&pageSize=20
    /// </summary>
    [HttpGet("users")]
    public async Task<IActionResult> GetUsers(
        [FromQuery] string? search,
        [FromQuery] string? status,
        [FromQuery] int? organizationId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var query = _db.Users.AsQueryable();

        // Search by name or email
        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.ToLower();
            query = query.Where(u => u.Name.ToLower().Contains(term)
                                  || u.Email.ToLower().Contains(term));
        }

        // Filter by status
        if (!string.IsNullOrWhiteSpace(status))
        {
            query = status.ToLower() switch
            {
                "blocked" => query.Where(u => u.IsBlocked),
                "active" => query.Where(u => !u.IsBlocked && u.IsEmailConfirmed),
                "unconfirmed" => query.Where(u => !u.IsEmailConfirmed),
                _ => query
            };
        }

        // Filter by organization membership
        if (organizationId.HasValue)
        {
            query = query.Where(u => u.OrganizationMemberships
            .Any(om => om.OrganizationId == organizationId.Value));
        }

        var totalCount = await query.CountAsync();

        var users = await query
            .OrderByDescending(u => u.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(u => new AdminUserListItemDto
            {
                Id = u.Id,
                Email = u.Email,
                Name = u.Name,
                Role = u.Role.ToString(),
                IsBlocked = u.IsBlocked,
                IsEmailConfirmed = u.IsEmailConfirmed,
                CreatedAt = u.CreatedAt,
                UpdatedAt = u.UpdatedAt,
                OrganizationCount = u.OrganizationMemberships.Count
            })
            .ToListAsync();

        return Ok(new AdminUserListResponseDto
        {
            Users = users,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        });
    }

    /// <summary>
    /// GET /api/admin/users/5
    /// </summary>
    [HttpGet("users/{userId}")]
    public async Task<IActionResult> GetUser(int userId)
    {
        var user = await _db.Users
            .Include(u => u.OrganizationMemberships)
                .ThenInclude(om => om.Organization)
            .Include(u => u.OrganizationMemberships)
                .ThenInclude(om => om.TeamMemberships)
                    .ThenInclude(tm => tm.Team)
            .Include(u => u.OrganizationMemberships)
                .ThenInclude(om => om.TeamMemberships)
                    .ThenInclude(tm => tm.AssignedWorkItems)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user is null)
            return NotFound(new { errors = new[] { "User not found." } });

        var dto = new AdminUserDetailDto
        {
            Id = user.Id,
            Email = user.Email,
            Name = user.Name,
            AvatarUrl = user.AvatarUrl,
            Role = user.Role.ToString(),
            IsBlocked = user.IsBlocked,
            IsEmailConfirmed = user.IsEmailConfirmed,
            CreatedAt = user.CreatedAt,
            UpdatedAt = user.UpdatedAt,
            Organizations = user.OrganizationMemberships.Select(om => new AdminUserOrgDto
            {
                OrganizationId = om.OrganizationId,
                OrganizationName = om.Organization.Name,
                Role = om.Role.ToString(),
                Status = om.Status.ToString(),
                JoinedAt = om.JoinedAt,
                Teams = om.TeamMemberships.Select(tm => new AdminUserTeamDto
                {
                    TeamId = tm.TeamId,
                    TeamName = tm.Team.Name,
                    Role = tm.Role.ToString(),
                    AssignedWorkItems = tm.AssignedWorkItems.Count
                }).ToList()
            }).ToList()
        };

        return Ok(dto);
    }

    /// <summary>
    /// PATCH /api/admin/users/5/block
    /// </summary>
    [HttpPatch("users/{userId}/block")]
    public async Task<IActionResult> BlockUser(int userId)
    {
        var user = await _db.Users.FindAsync(userId);
        if (user is null)
            return NotFound(new { errors = new[] { "User not found." } });

        if (user.Role == UserRole.Admin)
            return BadRequest(new { errors = new[] { "Cannot block an admin user." } });

        user.IsBlocked = true;
        user.UpdatedAt = DateTime.UtcNow;

        // Invalidate all active refresh tokens — forces logout
        var activeTokens = await _db.RefreshTokens
            .Where(rt => rt.UserId == userId && rt.RevokedAt == null)
            .ToListAsync();
        foreach (var token in activeTokens)
            token.RevokedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return Ok(new { message = "User blocked successfully." });
    }

    /// <summary>
    /// PATCH /api/admin/users/5/unblock
    /// </summary>
    [HttpPatch("users/{userId}/unblock")]
    public async Task<IActionResult> UnblockUser(int userId)
    {
        var user = await _db.Users.FindAsync(userId);
        if (user is null)
            return NotFound(new { errors = new[] { "User not found." } });

        user.IsBlocked = false;
        user.LockoutEnd = null;
        user.FailedLoginAttempts = 0;
        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(new { message = "User unblocked successfully." });
    }

    /// <summary>
    /// DELETE /api/admin/users/5
    /// </summary>
    [HttpDelete("users/{userId}")]
    public async Task<IActionResult> DeleteUser(int userId)
    {
        var user = await _db.Users
            .Include(u => u.RefreshTokens)
            .Include(u => u.RecentPages)
            .Include(u => u.PinnedTeams)
            .Include(u => u.OrganizationMemberships)
                .ThenInclude(om => om.TeamMemberships)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user is null)
            return NotFound(new { errors = new[] { "User not found." } });

        if (user.Role == UserRole.Admin)
            return BadRequest(new { errors = new[] { "Cannot delete an admin user." } });

        // Unassign work items assigned to this user's team memberships
        var teamMemberIds = user.OrganizationMemberships
            .SelectMany(om => om.TeamMemberships)
            .Select(tm => tm.Id)
            .ToList();

        if (teamMemberIds.Any())
        {
            var assignedItems = await _db.WorkItems
                .Where(wi => wi.AssignedTo != null && teamMemberIds.Contains(wi.AssignedTo.Value))
                .ToListAsync();
            foreach (var item in assignedItems)
                item.AssignedTo = null;
        }

        // Remove team memberships, org memberships, tokens, recent pages, pinned teams
        _db.RefreshTokens.RemoveRange(user.RefreshTokens);
        _db.RecentPages.RemoveRange(user.RecentPages);
        _db.PinnedTeams.RemoveRange(user.PinnedTeams);

        foreach (var orgMember in user.OrganizationMemberships)
            _db.TeamMembers.RemoveRange(orgMember.TeamMemberships);

        _db.OrganizationMembers.RemoveRange(user.OrganizationMemberships);
        _db.Users.Remove(user);

        await _db.SaveChangesAsync();

        return Ok(new { message = "User deleted successfully." });
    }

    /// <summary>
    /// POST /api/admin/users/5/reset-password
    /// Sends the same password reset email as "forgot password"
    /// </summary>
    [HttpPost("users/{userId}/reset-password")]
    public async Task<IActionResult> ResetUserPassword(int userId)
    {
        var user = await _db.Users.FindAsync(userId);
        if (user is null)
            return NotFound(new { errors = new[] { "User not found." } });

        // Reuse the existing forgot password flow — sends reset email to user
        await _authService.ForgotPasswordAsync(user.Email);

        return Ok(new { message = $"Password reset email sent to {user.Email}." });
    }
}