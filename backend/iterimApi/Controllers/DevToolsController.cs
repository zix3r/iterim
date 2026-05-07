using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using iterimApi.Data;
using iterimApi.Models.Entities;
using iterimApi.Models.Enums;
using iterimApi.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace iterimApi.Controllers;

/// <summary>
/// Development-only diagnostic endpoints. Gated to Admin role + Development environment.
/// Returns 404 in production regardless of role.
/// </summary>
[ApiController]
[Route("api/dev")]
[Authorize(Roles = "Admin")]
public class DevToolsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly INotificationService _notifications;
    private readonly IPasswordHasher<User> _passwordHasher;
    private readonly IWebHostEnvironment _env;

    public DevToolsController(
        AppDbContext db,
        INotificationService notifications,
        IPasswordHasher<User> passwordHasher,
        IWebHostEnvironment env)
    {
        _db = db;
        _notifications = notifications;
        _passwordHasher = passwordHasher;
        _env = env;
    }

    /// <summary>
    /// POST /api/dev/notifications/fire-all
    /// Fires one notification of each type for the current admin user. URLs are built
    /// from the user's first accessible org/product/team/workitem so all clicks navigate
    /// to real pages. If no work item exists, the work-item URLs fall back to /dashboard.
    /// </summary>
    [HttpPost("notifications/fire-all")]
    public async Task<IActionResult> FireAllNotifications()
    {
        if (!_env.IsDevelopment())
            return NotFound();

        var userId = GetUserId();
        var ctx = await ResolveContextAsync(userId);

        var workItemUrl = ctx.AllPresent
            ? $"/org/{ctx.OrgId}/products/{ctx.ProductId}/teams/{ctx.TeamId}/backlog?item={ctx.WorkItemId}"
            : "/dashboard";
        var teamUrl = ctx.OrgId.HasValue && ctx.ProductId.HasValue && ctx.TeamId.HasValue
            ? $"/org/{ctx.OrgId}/products/{ctx.ProductId}/teams/{ctx.TeamId}"
            : "/dashboard";
        var orgUrl = ctx.OrgId.HasValue ? $"/org/{ctx.OrgId}" : "/dashboard";

        await _notifications.CreateAsync(
            userId,
            NotificationType.WorkItemAssigned,
            "notifications.workItemAssigned.title",
            "notifications.workItemAssigned.message",
            new Dictionary<string, string> { ["workItemTitle"] = "Test: build the notification system" },
            workItemUrl);

        await _notifications.CreateAsync(
            userId,
            NotificationType.BlockerResolved,
            "notifications.blockerResolved.title",
            "notifications.blockerResolved.message",
            new Dictionary<string, string>
            {
                ["workItemTitle"] = "Test: ship Sprint 3",
                ["blockerTitle"] = "Test: finish ATPA spike",
            },
            workItemUrl);

        await _notifications.CreateAsync(
            userId,
            NotificationType.AddedToTeam,
            "notifications.addedToTeam.title",
            "notifications.addedToTeam.message",
            new Dictionary<string, string> { ["teamName"] = "Test Team" },
            teamUrl);

        await _notifications.CreateAsync(
            userId,
            NotificationType.AddedToOrganization,
            "notifications.addedToOrganization.title",
            "notifications.addedToOrganization.message",
            new Dictionary<string, string> { ["organizationName"] = "Test Org" },
            orgUrl);

        await _notifications.CreateAsync(
            userId,
            NotificationType.PasswordReset,
            "notifications.passwordReset.title",
            "notifications.passwordReset.message",
            null,
            "/login");

        return Ok(new
        {
            fired = 5,
            urls = new { workItemUrl, teamUrl, orgUrl, login = "/login" },
        });
    }

    /// <summary>
    /// POST /api/dev/seed-test-user
    /// Idempotently creates a "Test Colleague" user (testuser@iterim.dev / Test1234!),
    /// adds them as Active to the current admin's first organization and first team.
    /// Use this account in a separate browser to test the real notification triggers
    /// (assign work items to them, mark blockers Done, etc.).
    /// </summary>
    [HttpPost("seed-test-user")]
    public async Task<IActionResult> SeedTestUser()
    {
        if (!_env.IsDevelopment())
            return NotFound();

        const string testEmail = "testuser@iterim.dev";
        const string testPassword = "Test1234!";
        const string testName = "Test Colleague";

        var adminId = GetUserId();
        var ctx = await ResolveContextAsync(adminId);

        if (!ctx.OrgId.HasValue || !ctx.TeamId.HasValue)
            return BadRequest(new { errors = new[] { "Admin has no org/team to seed into." } });

        // 1. User
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == testEmail);
        var created = false;
        if (user == null)
        {
            user = new User
            {
                Email = testEmail,
                Name = testName,
                Role = UserRole.User,
                IsEmailConfirmed = true,
                Theme = "light",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            };
            user.PasswordHash = _passwordHasher.HashPassword(user, testPassword);
            _db.Users.Add(user);
            await _db.SaveChangesAsync();
            created = true;
        }

        // 2. OrganizationMember (idempotent)
        var orgMember = await _db.OrganizationMembers
            .FirstOrDefaultAsync(om => om.OrganizationId == ctx.OrgId && om.UserId == user.Id);
        if (orgMember == null)
        {
            orgMember = new OrganizationMember
            {
                OrganizationId = ctx.OrgId.Value,
                UserId = user.Id,
                Email = testEmail,
                Role = OrgMemberRole.Member,
                Status = OrgMemberStatus.Active,
                JoinedAt = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                InvitedBy = adminId,
            };
            _db.OrganizationMembers.Add(orgMember);
            await _db.SaveChangesAsync();
        }

        // 3. TeamMember (idempotent)
        var teamMember = await _db.TeamMembers
            .FirstOrDefaultAsync(tm => tm.TeamId == ctx.TeamId && tm.OrgMemberId == orgMember.Id);
        if (teamMember == null)
        {
            teamMember = new TeamMember
            {
                TeamId = ctx.TeamId.Value,
                OrgMemberId = orgMember.Id,
                Role = TeamMemberRole.Member,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                CreatedBy = adminId,
                UpdatedBy = adminId,
            };
            _db.TeamMembers.Add(teamMember);
            await _db.SaveChangesAsync();
        }

        return Ok(new
        {
            created,
            credentials = new { email = testEmail, password = testPassword },
            user = new { user.Id, user.Email, user.Name },
            orgMemberId = orgMember.Id,
            teamMemberId = teamMember.Id,
        });
    }

    // ── Helpers ──────────────────────────────────────────────

    private record DevContext(int? OrgId, int? ProductId, int? TeamId, int? WorkItemId)
    {
        public bool AllPresent =>
            OrgId.HasValue && ProductId.HasValue && TeamId.HasValue && WorkItemId.HasValue;
    }

    private async Task<DevContext> ResolveContextAsync(int userId)
    {
        var orgId = await _db.OrganizationMembers
            .Where(om => om.UserId == userId && om.Status == OrgMemberStatus.Active)
            .Select(om => (int?)om.OrganizationId)
            .FirstOrDefaultAsync();

        if (orgId == null) return new DevContext(null, null, null, null);

        var productId = await _db.Products
            .Where(p => p.OrganizationId == orgId)
            .Select(p => (int?)p.Id)
            .FirstOrDefaultAsync();

        if (productId == null) return new DevContext(orgId, null, null, null);

        var teamId = await _db.Teams
            .Where(t => t.ProductId == productId)
            .Select(t => (int?)t.Id)
            .FirstOrDefaultAsync();

        if (teamId == null) return new DevContext(orgId, productId, null, null);

        var workItemId = await _db.WorkItems
            .Where(wi => wi.TeamId == teamId)
            .Select(wi => (int?)wi.Id)
            .FirstOrDefaultAsync();

        return new DevContext(orgId, productId, teamId, workItemId);
    }

    private int GetUserId()
    {
        var idClaim = User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
                      ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrEmpty(idClaim) || !int.TryParse(idClaim, out var id))
            throw new UnauthorizedAccessException("Invalid user authentication");

        return id;
    }
}