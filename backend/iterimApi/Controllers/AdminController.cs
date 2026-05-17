using System.Security.Claims;
using iterimApi.Data;
using iterimApi.DTOs.Admin;
using iterimApi.Services.Interfaces;
using iterimApi.Models.Enums;
using iterimApi.Models.Entities;
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
    private readonly INotificationService _notifications;

    public AdminController(AppDbContext db, IAuthService authService, INotificationService notifications)
    {
        _db = db;
        _authService = authService;
        _notifications = notifications;
    }

    private int GetCurrentUserId()
    {
        var claim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (int.TryParse(claim, out int uid))
            return uid;
        throw new UnauthorizedAccessException("Invalid user token.");
    }

    /// <summary>
    /// GET /api/admin/users?search=rom&status=blocked&page=1&pageSize=20
    /// </summary>
    [HttpGet("users")]
    public async Task<IActionResult> GetUsers(
        [FromQuery] string? search,
        [FromQuery] string? status,
        [FromQuery] int? organizationId,
        [FromQuery] string? sortBy,
        [FromQuery] string? sortOrder,
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

        // Sorting
        IOrderedQueryable<User> ordered = (sortBy?.ToLower(), sortOrder?.ToLower()) switch
        {
            ("name", "asc") => query.OrderBy(u => u.Name),
            ("name", _) => query.OrderByDescending(u => u.Name),
            ("email", "asc") => query.OrderBy(u => u.Email),
            ("email", _) => query.OrderByDescending(u => u.Email),
            ("status", "asc") => query.OrderBy(u => u.IsBlocked).ThenBy(u => u.IsEmailConfirmed),
            ("status", _) => query.OrderByDescending(u => u.IsBlocked).ThenByDescending(u => u.IsEmailConfirmed),
            ("role", "asc") => query.OrderBy(u => u.Role),
            ("role", _) => query.OrderByDescending(u => u.Role),
            ("orgs", "asc") => query.OrderBy(u => u.OrganizationMemberships.Count),
            ("orgs", _) => query.OrderByDescending(u => u.OrganizationMemberships.Count),
            ("registered", "asc") => query.OrderBy(u => u.CreatedAt),
            ("registered", _) => query.OrderByDescending(u => u.CreatedAt),
            _ => query.OrderByDescending(u => u.CreatedAt)
        };

        var users = await ordered
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
    /// GET /api/admin/organizations — for filter dropdown
    /// </summary>
    [HttpGet("organizations")]
    public async Task<IActionResult> GetOrganizations()
    {
        var orgs = await _db.Organizations
            .OrderBy(o => o.Name)
            .Select(o => new { o.Id, o.Name })
            .ToListAsync();

        return Ok(orgs);
    }

    /// <summary>
    /// GET /api/admin/stats
    /// </summary>
    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var now = DateTime.UtcNow;

        var totalUsers = await _db.Users.CountAsync();
        var newUsersWeek = await _db.Users.CountAsync(u => u.CreatedAt >= now.AddDays(-7));
        var newUsersMonth = await _db.Users.CountAsync(u => u.CreatedAt >= now.AddDays(-30));
        var blockedUsers = await _db.Users.CountAsync(u => u.IsBlocked);
        var unconfirmedUsers = await _db.Users.CountAsync(u => !u.IsEmailConfirmed);

        var totalOrganizations = await _db.Organizations.CountAsync();
        var totalProducts = await _db.Products.CountAsync();
        var totalTeams = await _db.Teams.CountAsync();

        var totalWorkItems = await _db.WorkItems.CountAsync();
        var workItemsByStatus = await _db.WorkItems
            .GroupBy(wi => wi.Status)
            .Select(g => new { Status = g.Key.ToString(), Count = g.Count() })
            .ToListAsync();

        var totalIterations = await _db.Iterations.CountAsync();
        var activeIterations = await _db.Iterations.CountAsync(i => i.Status == Models.Enums.IterationStatus.Active);
        var completedIterations = await _db.Iterations.CountAsync(i => i.Status == Models.Enums.IterationStatus.Completed);

        return Ok(new
        {
            users = new { total = totalUsers, newThisWeek = newUsersWeek, newThisMonth = newUsersMonth, blocked = blockedUsers, unconfirmed = unconfirmedUsers },
            organizations = new { total = totalOrganizations },
            products = new { total = totalProducts },
            teams = new { total = totalTeams },
            workItems = new { total = totalWorkItems, byStatus = workItemsByStatus },
            iterations = new { total = totalIterations, active = activeIterations, completed = completedIterations }
        });
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
    /// PATCH /api/admin/users/{userId}/role
    /// Pakeičia globalią vartotojo rolę (Admin / User).
    ///
    /// Apsauga: sumažinti kito Admin rolę gali tik tas Admin, kuris šią rolę
    /// jam pats suteikė. Tai užtikrina, kad bet kuris adminas negalėtų
    /// piktnaudžiaudamas „nuvalyti" kitų adminų teisių.
    /// </summary>
    [HttpPatch("users/{userId}/role")]
    public async Task<IActionResult> UpdateUserRole(int userId, [FromBody] UpdateUserRoleDto dto)
    {
        if (!Enum.TryParse<UserRole>(dto.Role, true, out var newRole))
            return BadRequest(new { errors = new[] { "Invalid role. Valid roles are: Admin, User." } });

        var target = await _db.Users.FindAsync(userId);
        if (target is null)
            return NotFound(new { errors = new[] { "User not found." } });

        var requestingUserId = GetCurrentUserId();

        // Negali keisti savo rolės — kitaip pats sau galėtų atimti admino teises.
        if (target.Id == requestingUserId)
            return BadRequest(new { errors = new[] { "Negalite pakeisti savo paties rolės." } });

        // Šis endpoint'as veikia tik su Admin role authorize, tad requester yra Admin.
        bool isDemotion = target.Role == UserRole.Admin && newRole != UserRole.Admin;

        if (isDemotion)
        {
            // Sumažinti gali tik tas, kuris suteikė admin rolę šiam vartotojui.
            // Jei target.RoleGrantedByUserId == null, jis yra „pradinis" admin
            // (pvz. seed'ina sistema), todėl jo niekas demote'inti negali per šį endpoint'ą.
            bool requesterGrantedRole =
                target.RoleGrantedByUserId.HasValue &&
                target.RoleGrantedByUserId.Value == requestingUserId;

            if (!requesterGrantedRole)
            {
                return StatusCode(403, new
                {
                    errors = new[]
                    {
                        "Sumažinti administratoriaus rolę gali tik tas administratorius, " +
                        "kuris šią rolę suteikė."
                    }
                });
            }
        }

        if (target.Role == newRole)
            return Ok(new { message = "No change.", role = target.Role.ToString() });

        target.Role = newRole;
        target.UpdatedAt = DateTime.UtcNow;
        // Audit: kas suteikė naują rolę.
        target.RoleGrantedByUserId = newRole == UserRole.Admin ? requestingUserId : (int?)null;

        await _db.SaveChangesAsync();

        return Ok(new { message = "Role updated.", role = target.Role.ToString() });
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

        // In-app notification so the user sees a heads-up the next time they log in.
        await _notifications.CreateAsync(
            user.Id,
            NotificationType.PasswordReset,
            "notifications.passwordReset.title",
            "notifications.passwordReset.message",
            relatedUrl: "/login");

        return Ok(new { message = $"Password reset email sent to {user.Email}." });
    }
}