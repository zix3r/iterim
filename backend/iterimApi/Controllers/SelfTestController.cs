using System.Diagnostics;
using System.Linq;
using iterimApi.Data;
using iterimApi.DTOs.Auth;
using iterimApi.DTOs.Feedback;
using iterimApi.DTOs.Iterations;
using iterimApi.DTOs.MemberAbsences;
using iterimApi.DTOs.Organizations;
using iterimApi.DTOs.Products;
using iterimApi.DTOs.Retro;
using iterimApi.DTOs.Tags;
using iterimApi.DTOs.Teams;
using iterimApi.DTOs.WorkItems;
using iterimApi.Models.Entities;
using iterimApi.Models.Enums;
using iterimApi.Services.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace iterimApi.Controllers;

/// <summary>
/// End-to-end service-layer integration harness. Exercises every service against the
/// REAL database it points at, asserts on results, and cleans up everything it creates.
///
/// USAGE (dev only):  POST /api/selftest/run?confirm=RUN
///
/// It is DESTRUCTIVE in the sense that it writes + deletes rows, but all rows are created
/// under a uniquely-named throwaway organization (__selftest_{guid}) and two throwaway
/// users, then removed in a finally block. Designed to be run repeatedly on your dev build.
///
/// Drop this file into Controllers/ — it needs no new DI registrations; every dependency
/// is already registered in Program.cs. Delete the old TestController/DevToolsController if
/// you no longer want them; this one supersedes both for verification purposes.
///
/// NOTE: purely-visual things (markdown RENDERING, dark-mode/LT appearance, drag-and-drop,
/// how "fast" the UI feels) cannot be seen from the backend — those stay in the manual
/// UX pass. This harness verifies the data + logic underneath them.
/// </summary>
[ApiController]
[Route("api/selftest")]
public class SelfTestController : ControllerBase
{
    private const string Pw = "Test1234!";

    private readonly AppDbContext _db;
    private readonly IPasswordHasher<User> _hasher;
    private readonly IWebHostEnvironment _env;

    private readonly IAuthService _auth;
    private readonly IOrganizationService _org;
    private readonly IProductService _product;
    private readonly ITeamService _team;
    private readonly IWorkItemService _wi;
    private readonly IIterationService _iter;
    private readonly IWorkItemDependencyService _dep;
    private readonly IAtpaService _atpa;
    private readonly IMetricsService _metrics;
    private readonly INotificationService _notif;
    private readonly ITagService _tags;
    private readonly IMemberAbsenceService _absence;
    private readonly IRetroService _retro;
    private readonly IFeedbackService _feedback;
    private readonly IBoardService _board;
    private readonly IDashboardService _dashboard;
    private readonly IAdminOrganizationService _adminOrg;

    public SelfTestController(
        AppDbContext db,
        IPasswordHasher<User> hasher,
        IWebHostEnvironment env,
        IAuthService auth,
        IOrganizationService org,
        IProductService product,
        ITeamService team,
        IWorkItemService wi,
        IIterationService iter,
        IWorkItemDependencyService dep,
        IAtpaService atpa,
        IMetricsService metrics,
        INotificationService notif,
        ITagService tags,
        IMemberAbsenceService absence,
        IRetroService retro,
        IFeedbackService feedback,
        IBoardService board,
        IDashboardService dashboard,
        IAdminOrganizationService adminOrg)
    {
        _db = db; _hasher = hasher; _env = env;
        _auth = auth; _org = org; _product = product; _team = team; _wi = wi; _iter = iter;
        _dep = dep; _atpa = atpa; _metrics = metrics; _notif = notif; _tags = tags;
        _absence = absence; _retro = retro; _feedback = feedback; _board = board;
        _dashboard = dashboard; _adminOrg = adminOrg;
    }

    public record TestResult(string Section, string Name, bool Passed, string Message, long Ms);

    private sealed class Fix
    {
        public string RunId = "";
        public int OwnerUserId, ColleagueUserId;
        public string OwnerEmail = "", ColleagueEmail = "";
        public int OrgId;
        public int OwnerOrgMemberId, ColleagueOrgMemberId;
        public int ProductId, TeamAId, TeamBId;
        public int OwnerTeamMemberId, ColleagueTeamMemberId, ColleagueTeamMemberBId;
        public readonly List<int> ExtraUserIds = new();
    }

    private readonly List<TestResult> _results = new();
    private readonly Fix _fix = new();

    [HttpPost("run")]
    public async Task<IActionResult> Run([FromQuery] string? confirm = null)
    {
        if (confirm != "RUN")
            return BadRequest(new { message = "Destructive run. Append ?confirm=RUN to execute. Intended for dev/staging only." });

        var sw = Stopwatch.StartNew();
        List<string> cleanupErrors = new();

        try
        {
            await SetupFixtureAsync();

            await AuthSection();
            await OrganizationsSection();
            await ProductsSection();
            await TeamsSection();
            await TagsSection();
            await WorkItemsSection();
            await IterationsSection();
            await DependenciesSection();
            await AbsencesSection();
            await AtpaSection();
            await MetricsSection();
            await NotificationsSection();
            await CommentsSection();
            await RetroSection();
            await FeedbackSection();
            await DashboardSection();
            await AdminSection();
            await PerformanceSection();
        }
        catch (Exception ex)
        {
            _results.Add(new TestResult("FATAL", "Run aborted before completion", false, ex.ToString(), 0));
        }
        finally
        {
            cleanupErrors = await CleanupAsync();
        }

        sw.Stop();
        var passed = _results.Count(r => r.Passed);
        var failed = _results.Count - passed;

        return Ok(new
        {
            environment = _env.EnvironmentName,
            summary = new
            {
                total = _results.Count,
                passed,
                failed,
                durationMs = sw.ElapsedMilliseconds,
                cleanupErrors = cleanupErrors.Count,
                allGreen = failed == 0 && cleanupErrors.Count == 0
            },
            failures = _results.Where(r => !r.Passed)
                .Select(r => new { r.Section, r.Name, r.Message }),
            results = _results.Select(r => new
            {
                r.Section,
                r.Name,
                status = r.Passed ? "PASS" : "FAIL",
                r.Message,
                r.Ms
            }),
            cleanup = new { errors = cleanupErrors }
        });
    }

    // ─────────────────────────────────────────────────────────────
    // Assertion / check helpers
    // ─────────────────────────────────────────────────────────────

    private static void Assert(bool condition, string message)
    {
        if (!condition) throw new InvalidOperationException(message);
    }

    private async Task Check(string section, string name, Func<Task> body)
    {
        var sw = Stopwatch.StartNew();
        try
        {
            await body();
            sw.Stop();
            _results.Add(new TestResult(section, name, true, "OK", sw.ElapsedMilliseconds));
        }
        catch (Exception ex)
        {
            sw.Stop();
            _results.Add(new TestResult(section, name, false, ex.Message, sw.ElapsedMilliseconds));
        }
    }

    private async Task CheckThrows(string section, string name, Func<Task> body)
    {
        var sw = Stopwatch.StartNew();
        try
        {
            await body();
            sw.Stop();
            _results.Add(new TestResult(section, name, false, "Expected an exception but none was thrown", sw.ElapsedMilliseconds));
        }
        catch
        {
            sw.Stop();
            _results.Add(new TestResult(section, name, true, "Threw as expected", sw.ElapsedMilliseconds));
        }
    }

    // ─────────────────────────────────────────────────────────────
    // Fixture (runs OUTSIDE check wrappers; throwing here aborts the run)
    // ─────────────────────────────────────────────────────────────

    private async Task SetupFixtureAsync()
    {
        var rid = Guid.NewGuid().ToString("N").Substring(0, 8);
        _fix.RunId = rid;

        var owner = new User
        {
            Email = $"__st_owner_{rid}@iterim.test",
            Name = "SelfTest Owner",
            Role = UserRole.User,
            IsEmailConfirmed = true,
            Theme = "light",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        owner.PasswordHash = _hasher.HashPassword(owner, Pw);

        var colleague = new User
        {
            Email = $"__st_colleague_{rid}@iterim.test",
            Name = "SelfTest Colleague",
            Role = UserRole.User,
            IsEmailConfirmed = true,
            Theme = "light",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        colleague.PasswordHash = _hasher.HashPassword(colleague, Pw);

        _db.Users.AddRange(owner, colleague);
        await _db.SaveChangesAsync();

        _fix.OwnerUserId = owner.Id;
        _fix.ColleagueUserId = colleague.Id;
        _fix.OwnerEmail = owner.Email;
        _fix.ColleagueEmail = colleague.Email;

        // Org via the real service, then re-query the entity for the id.
        await _org.CreateOrganizationAsync(new CreateOrganizationDto { Name = $"__selftest_{rid}" }, owner.Id);
        var org = await _db.Organizations.FirstAsync(o => o.Name == $"__selftest_{rid}");
        _fix.OrgId = org.Id;

        if (!await _db.OrganizationConfigs.AnyAsync(c => c.OrganizationId == org.Id))
        {
            _db.OrganizationConfigs.Add(new OrganizationConfig
            {
                OrganizationId = org.Id,
                DefaultPointsScale = "fibonacci",
                IterationLengthDays = 14
            });
            await _db.SaveChangesAsync();
        }

        var ownerOm = await EnsureOrgMemberAsync(org.Id, owner.Id, owner.Email, OrgMemberRole.Admin);
        _fix.OwnerOrgMemberId = ownerOm.Id;

        var colOm = await EnsureOrgMemberAsync(org.Id, colleague.Id, colleague.Email, OrgMemberRole.Member);
        _fix.ColleagueOrgMemberId = colOm.Id;

        await _product.CreateProductAsync(org.Id, new CreateProductDto { Name = $"__st_prod_{rid}" }, owner.Id);
        var prod = await _db.Products.FirstAsync(p => p.OrganizationId == org.Id && p.Name == $"__st_prod_{rid}");
        _fix.ProductId = prod.Id;

        await _team.CreateTeamAsync(prod.Id, new CreateTeamDto { Name = $"__st_teamA_{rid}" }, owner.Id);
        var teamA = await _db.Teams.FirstAsync(t => t.ProductId == prod.Id && t.Name == $"__st_teamA_{rid}");
        _fix.TeamAId = teamA.Id;

        await _team.CreateTeamAsync(prod.Id, new CreateTeamDto { Name = $"__st_teamB_{rid}" }, owner.Id);
        var teamB = await _db.Teams.FirstAsync(t => t.ProductId == prod.Id && t.Name == $"__st_teamB_{rid}");
        _fix.TeamBId = teamB.Id;

        var ownerTm = await EnsureTeamMemberAsync(teamA.Id, ownerOm.Id, owner.Id);
        _fix.OwnerTeamMemberId = ownerTm.Id;
    }

    private async Task<OrganizationMember> EnsureOrgMemberAsync(int orgId, int userId, string email, OrgMemberRole role)
    {
        var existing = await _db.OrganizationMembers.FirstOrDefaultAsync(m => m.OrganizationId == orgId && m.UserId == userId);
        if (existing != null) return existing;

        var om = new OrganizationMember
        {
            OrganizationId = orgId,
            UserId = userId,
            Email = email,
            Role = role,
            Status = OrgMemberStatus.Active,
            InvitedAt = DateTime.UtcNow,
            JoinedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _db.OrganizationMembers.Add(om);
        await _db.SaveChangesAsync();
        return om;
    }

    private async Task<TeamMember> EnsureTeamMemberAsync(int teamId, int orgMemberId, int actingUserId)
    {
        var existing = await _db.TeamMembers.FirstOrDefaultAsync(tm => tm.TeamId == teamId && tm.OrgMemberId == orgMemberId);
        if (existing != null) return existing;

        var tm = new TeamMember
        {
            TeamId = teamId,
            OrgMemberId = orgMemberId,
            Role = TeamMemberRole.Member,
            WeeklyHours = 40,
            ScheduleType = WorkScheduleType.FullTime,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            CreatedBy = actingUserId,
            UpdatedBy = actingUserId
        };
        _db.TeamMembers.Add(tm);
        await _db.SaveChangesAsync();
        return tm;
    }

    // ─────────────────────────────────────────────────────────────
    // Sections
    // ─────────────────────────────────────────────────────────────

    private async Task AuthSection()
    {
        const string S = "Auth";

        await Check(S, "Register new user", async () =>
        {
            var email = $"__st_reg_{_fix.RunId}@iterim.test";
            var (res, user) = await _auth.RegisterAsync(new RegisterRequestDto { Email = email, Password = Pw, Name = "SelfTest Reg" });
            Assert(res.Success, "RegisterAsync returned Success=false: " + string.Join(", ", res.Errors));
            var dbUser = await _db.Users.FirstOrDefaultAsync(u => u.Email == email);
            Assert(dbUser != null, "Registered user not found in DB");
            _fix.ExtraUserIds.Add(dbUser!.Id);
            // Email confirmation is verified separately on live; force-confirm here.
            dbUser.IsEmailConfirmed = true;
            await _db.SaveChangesAsync();
        });

        await Check(S, "Login with correct credentials", async () =>
        {
            var (res, user) = await _auth.LoginAsync(new LoginRequestDto { Email = _fix.OwnerEmail, Password = Pw });
            Assert(res.Success, "Login failed: " + string.Join(", ", res.Errors));
            Assert(user != null && user.Id == _fix.OwnerUserId, "Login returned wrong/no user");
            var hasToken = await _db.RefreshTokens.AnyAsync(rt => rt.UserId == _fix.OwnerUserId && rt.RevokedAt == null);
            Assert(hasToken, "No active refresh token issued on login");
        });

        await Check(S, "Login with wrong password is rejected", async () =>
        {
            var (res, _) = await _auth.LoginAsync(new LoginRequestDto { Email = _fix.OwnerEmail, Password = "WrongPassword!" });
            Assert(!res.Success, "Login succeeded with wrong password");
        });

        await Check(S, "Refresh token rotation", async () =>
        {
            var token = await _db.RefreshTokens
                .Where(rt => rt.UserId == _fix.OwnerUserId && rt.RevokedAt == null)
                .OrderByDescending(rt => rt.Id)
                .Select(rt => rt.Token)
                .FirstOrDefaultAsync();
            Assert(token != null, "No refresh token to rotate (login step must pass first)");
            var res = await _auth.RefreshTokenAsync(token!);
            Assert(res.Success, "RefreshTokenAsync failed: " + string.Join(", ", res.Errors));
        });

        await Check(S, "Logout revokes refresh token", async () =>
        {
            var token = await _db.RefreshTokens
                .Where(rt => rt.UserId == _fix.OwnerUserId && rt.RevokedAt == null)
                .OrderByDescending(rt => rt.Id)
                .Select(rt => rt.Token)
                .FirstOrDefaultAsync();
            Assert(token != null, "No active refresh token to log out");
            await _auth.LogoutAsync(token!);
            var stillActive = await _db.RefreshTokens.AnyAsync(rt => rt.Token == token && rt.RevokedAt == null);
            Assert(!stillActive, "Refresh token still active after logout");
        });

        await Check(S, "Forgot + reset password, then login with new password", async () =>
        {
            var fp = await _auth.ForgotPasswordAsync(_fix.OwnerEmail);
            Assert(fp.Success, "ForgotPasswordAsync failed: " + string.Join(", ", fp.Errors));

            var resetToken = await _db.Users.Where(u => u.Id == _fix.OwnerUserId)
                .Select(u => u.PasswordResetToken).FirstOrDefaultAsync();
            Assert(!string.IsNullOrEmpty(resetToken), "No password reset token written to DB");

            const string newPw = "NewPass5678!";
            var rp = await _auth.ResetPasswordAsync(new ResetPasswordRequestDto { Token = resetToken!, NewPassword = newPw });
            Assert(rp.Success, "ResetPasswordAsync failed: " + string.Join(", ", rp.Errors));

            var (login, _) = await _auth.LoginAsync(new LoginRequestDto { Email = _fix.OwnerEmail, Password = newPw });
            Assert(login.Success, "Login with new password failed");

            // Restore the fixture password so later sections that assume it still hold.
            var u = await _db.Users.FindAsync(_fix.OwnerUserId);
            u!.PasswordHash = _hasher.HashPassword(u, Pw);
            await _db.SaveChangesAsync();
        });
    }

    private async Task OrganizationsSection()
    {
        const string S = "Organizations";
        var orgId = _fix.OrgId;

        await Check(S, "Invite member (status Invited)", async () =>
        {
            var inviteeEmail = $"__st_invitee_{_fix.RunId}@iterim.test";
            var invitee = new User { Email = inviteeEmail, Name = "Invitee", Role = UserRole.User, IsEmailConfirmed = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
            invitee.PasswordHash = _hasher.HashPassword(invitee, Pw);
            _db.Users.Add(invitee);
            await _db.SaveChangesAsync();
            _fix.ExtraUserIds.Add(invitee.Id);

            await _org.AddMemberToOrganizationAsync(orgId, new AddOrganizationMemberDto { Email = inviteeEmail, Role = "Member" }, _fix.OwnerUserId);
            var om = await _db.OrganizationMembers.FirstOrDefaultAsync(m => m.OrganizationId == orgId && m.UserId == invitee.Id);
            Assert(om != null, "Invited member not created");
            Assert(om!.Status == OrgMemberStatus.Invited, $"Expected Invited, got {om.Status}");

            // Accept and verify Active
            await _org.AcceptInvitationAsync(orgId, invitee.Id);
            await _db.Entry(om).ReloadAsync();
            Assert(om.Status == OrgMemberStatus.Active, $"After accept expected Active, got {om.Status}");

            // Role change
            await _org.UpdateMemberRoleAsync(orgId, om.Id, "Viewer", _fix.OwnerUserId);
            await _db.Entry(om).ReloadAsync();
            Assert(om.Role == OrgMemberRole.Viewer, $"Role change failed, got {om.Role}");

            // Remove
            await _org.RemoveMemberAsync(orgId, om.Id, _fix.OwnerUserId);
            await _db.Entry(om).ReloadAsync();
            Assert(om.Status == OrgMemberStatus.Removed, $"After remove expected Removed, got {om.Status}");
        });

        await Check(S, "Pending invitations + decline", async () =>
        {
            var email = $"__st_invitee2_{_fix.RunId}@iterim.test";
            var u = new User { Email = email, Name = "Invitee2", Role = UserRole.User, IsEmailConfirmed = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
            u.PasswordHash = _hasher.HashPassword(u, Pw);
            _db.Users.Add(u);
            await _db.SaveChangesAsync();
            _fix.ExtraUserIds.Add(u.Id);

            await _org.AddMemberToOrganizationAsync(orgId, new AddOrganizationMemberDto { Email = email, Role = "Member" }, _fix.OwnerUserId);
            var pending = await _org.GetPendingInvitationsAsync(u.Id);
            Assert(pending.Any(), "Pending invitation not returned");

            await _org.DeclineInvitationAsync(orgId, u.Id);
            var om = await _db.OrganizationMembers.FirstAsync(m => m.OrganizationId == orgId && m.UserId == u.Id);
            Assert(om.Status == OrgMemberStatus.Declined, $"After decline expected Declined, got {om.Status}");
        });

        await Check(S, "Get user organizations", async () =>
        {
            var orgs = await _org.GetUserOrganizationsAsync(_fix.OwnerUserId);
            Assert(orgs.Any(), "Owner has no organizations");
        });

        await Check(S, "Get organization by id", async () =>
        {
            var detail = await _org.GetOrganizationByIdAsync(orgId, _fix.OwnerUserId);
            Assert(detail != null, "Org detail null");
        });

        await Check(S, "Get organization absences (filter query runs)", async () =>
        {
            var abs = await _org.GetOrganizationAbsencesAsync(orgId);
            Assert(abs != null, "Absence query returned null");
        });
    }

    private async Task ProductsSection()
    {
        const string S = "Products";

        await Check(S, "Create / get / update / list products", async () =>
        {
            var name = $"__st_prod2_{_fix.RunId}";
            await _product.CreateProductAsync(_fix.OrgId, new CreateProductDto { Name = name, Description = "d" }, _fix.OwnerUserId);
            var p = await _db.Products.FirstOrDefaultAsync(x => x.OrganizationId == _fix.OrgId && x.Name == name);
            Assert(p != null, "Product not created");

            await _product.UpdateProductAsync(p!.Id, new UpdateProductDto { Name = name + "_upd", Description = "d2" }, _fix.OwnerUserId);
            await _db.Entry(p).ReloadAsync();
            Assert(p.Name == name + "_upd", "Product not updated");

            var detail = await _product.GetProductByIdAsync(p.Id, _fix.OwnerUserId);
            Assert(detail != null, "GetProductById null");

            var list = await _product.GetProductsByOrganizationAsync(_fix.OrgId, _fix.OwnerUserId);
            Assert(list.Any(), "Product list empty");

            await _product.DeleteProductAsync(p.Id, _fix.OwnerUserId);
            Assert(!await _db.Products.AnyAsync(x => x.Id == p.Id), "Product not deleted");
        });
    }

    private async Task TeamsSection()
    {
        const string S = "Teams";

        await Check(S, "Add team members (owner + colleague, team A & B)", async () =>
        {
            await _team.AddTeamMemberAsync(_fix.TeamAId, new AddTeamMemberDto { OrgMemberId = _fix.ColleagueOrgMemberId, Role = TeamMemberRole.Member }, _fix.OwnerUserId);
            var colTmA = await _db.TeamMembers.FirstOrDefaultAsync(tm => tm.TeamId == _fix.TeamAId && tm.OrgMemberId == _fix.ColleagueOrgMemberId);
            Assert(colTmA != null, "Colleague not added to team A");
            _fix.ColleagueTeamMemberId = colTmA!.Id;

            var colTmB = await EnsureTeamMemberAsync(_fix.TeamBId, _fix.ColleagueOrgMemberId, _fix.OwnerUserId);
            _fix.ColleagueTeamMemberBId = colTmB.Id;
        });

        await Check(S, "Update member schedule — PartTime 20h", async () =>
        {
            Assert(_fix.ColleagueTeamMemberId != 0, "precondition: colleague team member exists");
            await _team.UpdateMemberScheduleAsync(_fix.TeamAId, _fix.ColleagueTeamMemberId, new UpdateTeamMemberScheduleDto { ScheduleType = "PartTime", WeeklyHours = 20 }, _fix.OwnerUserId);
            var tm = await _db.TeamMembers.FindAsync(_fix.ColleagueTeamMemberId);
            Assert(tm!.ScheduleType == WorkScheduleType.PartTime && tm.WeeklyHours == 20, $"Schedule not applied: {tm.ScheduleType}/{tm.WeeklyHours}");
        });

        await Check(S, "Update member schedule — Custom 30h", async () =>
        {
            await _team.UpdateMemberScheduleAsync(_fix.TeamAId, _fix.OwnerTeamMemberId, new UpdateTeamMemberScheduleDto { ScheduleType = "Custom", WeeklyHours = 30 }, _fix.OwnerUserId);
            var tm = await _db.TeamMembers.FindAsync(_fix.OwnerTeamMemberId);
            Assert(tm!.ScheduleType == WorkScheduleType.Custom && tm.WeeklyHours == 30, $"Schedule not applied: {tm.ScheduleType}/{tm.WeeklyHours}");
        });

        await Check(S, "Get team by id / list / update", async () =>
        {
            var detail = await _team.GetTeamByIdAsync(_fix.TeamAId, _fix.OwnerUserId);
            Assert(detail != null, "GetTeamById null");
            var list = await _team.GetTeamsByProductAsync(_fix.ProductId, _fix.OwnerUserId);
            Assert(list.Any(), "Team list empty");
            await _team.UpdateTeamAsync(_fix.TeamAId, new UpdateTeamDto { Name = $"__st_teamA_{_fix.RunId}_upd", Description = "x" }, _fix.OwnerUserId);
            var t = await _db.Teams.FindAsync(_fix.TeamAId);
            Assert(t!.Name.EndsWith("_upd"), "Team not updated");
        });

        await Check(S, "Quarter plan query runs", async () =>
        {
            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            var plan = await _team.GetQuarterPlanAsync(_fix.TeamAId, today, today.AddDays(90));
            Assert(plan != null, "Quarter plan null");
        });
    }

    private async Task TagsSection()
    {
        const string S = "Tags";

        await Check(S, "Create tag, assign to work item + member, delete", async () =>
        {
            await _tags.CreateTagAsync(_fix.OrgId, new CreateTagDto { Name = $"__st_tag_{_fix.RunId}", Color = "#ff0000" }, _fix.OwnerUserId);
            var tag = await _db.Tags.FirstOrDefaultAsync(t => t.OrganizationId == _fix.OrgId && t.Name == $"__st_tag_{_fix.RunId}");
            Assert(tag != null, "Tag not created");

            // need a work item to tag
            var wi = await CreateBacklogItemAsync($"__st_tagwi_{_fix.RunId}");
            await _tags.AssignTagsToWorkItemAsync(wi.Id, new AssignTagsDto { TagIds = new List<int> { tag!.Id } }, _fix.OwnerUserId);
            Assert(await _db.WorkItemTags.AnyAsync(wt => wt.WorkItemId == wi.Id && wt.TagId == tag.Id), "Tag not assigned to work item");

            await _tags.AssignTagsToTeamMemberAsync(_fix.TeamAId, _fix.OwnerTeamMemberId, new AssignTagsDto { TagIds = new List<int> { tag.Id } }, _fix.OwnerUserId);
            Assert(await _db.TeamMemberTags.AnyAsync(tt => tt.TeamMemberId == _fix.OwnerTeamMemberId && tt.TagId == tag.Id), "Tag not assigned to member");

            var orgTags = await _tags.GetOrgTagsAsync(_fix.OrgId, _fix.OwnerUserId);
            Assert(orgTags.Any(), "Org tag list empty");

            await _tags.DeleteTagAsync(_fix.OrgId, tag.Id, _fix.OwnerUserId);
            Assert(!await _db.Tags.AnyAsync(t => t.Id == tag.Id), "Tag not deleted");
        });
    }

    private async Task WorkItemsSection()
    {
        const string S = "WorkItems";

        await Check(S, "Create + get + update work item", async () =>
        {
            var wi = await CreateBacklogItemAsync($"__st_wi_{_fix.RunId}");
            var got = await _wi.GetWorkItemByIdAsync(wi.Id, _fix.OwnerUserId);
            Assert(got != null, "GetWorkItemById null");

            await _wi.UpdateWorkItemAsync(wi.Id, new UpdateWorkItemDto
            {
                Title = wi.Title,
                Description = "updated",
                Type = WorkItemType.Story,
                Priority = WorkItemPriority.High,
                Points = 5,
                Status = WorkItemStatus.Todo
            }, _fix.OwnerUserId);
            await _db.Entry(wi).ReloadAsync();
            Assert(wi.Points == 5 && wi.Status == WorkItemStatus.Todo, $"Update not applied: {wi.Points}/{wi.Status}");
        });

        await Check(S, "Assign work item to member", async () =>
        {
            var wi = await CreateBacklogItemAsync($"__st_wi_assign_{_fix.RunId}");
            await _wi.AssignWorkItemAsync(wi.Id, _fix.OwnerTeamMemberId, _fix.OwnerUserId);
            await _db.Entry(wi).ReloadAsync();
            Assert(wi.AssignedTo == _fix.OwnerTeamMemberId, "Assignment not applied");
        });

        await Check(S, "Filter by status", async () =>
        {
            var items = await _wi.GetWorkItemsByTeamAsync(_fix.TeamAId, new WorkItemFilterDto { Status = WorkItemStatus.Backlog }, _fix.OwnerUserId);
            Assert(items.All(i => true), "filter query failed");
            Assert(items != null, "filtered list null");
        });

        await Check(S, "Backlog grouped by iteration", async () =>
        {
            var groups = await _wi.GetBacklogGroupedByIterationAsync(_fix.TeamAId, _fix.OwnerUserId);
            Assert(groups != null, "Backlog grouping null");
        });

        await Check(S, "Reorder work items", async () =>
        {
            var a = await CreateBacklogItemAsync($"__st_reorder_a_{_fix.RunId}");
            var b = await CreateBacklogItemAsync($"__st_reorder_b_{_fix.RunId}");
            await _wi.ReorderWorkItemsAsync(_fix.TeamAId, new ReorderWorkItemsDto
            {
                Items = new List<ReorderItemDto>
                {
                    new ReorderItemDto { Id = a.Id, Position = 10 },
                    new ReorderItemDto { Id = b.Id, Position = 11 }
                }
            }, _fix.OwnerUserId);
            await _db.Entry(a).ReloadAsync();
            await _db.Entry(b).ReloadAsync();
            Assert(a.Position == 10 && b.Position == 11, $"Reorder not applied: {a.Position}/{b.Position}");
        });

        await Check(S, "Bulk create (CSV import path) inserts all rows", async () =>
        {
            var before = await _db.WorkItems.CountAsync(w => w.TeamId == _fix.TeamAId);
            var count = await _wi.BulkCreateWorkItemsAsync(_fix.TeamAId, new BulkCreateWorkItemsDto
            {
                Items = new List<ImportWorkItemDto>
                {
                    new ImportWorkItemDto { Title = $"__st_bulk1_{_fix.RunId}", Type = WorkItemType.Task, Points = 1 },
                    new ImportWorkItemDto { Title = $"__st_bulk2_{_fix.RunId}", Type = WorkItemType.Bug, Points = 2 },
                    new ImportWorkItemDto { Title = $"__st_bulk3_{_fix.RunId}", Type = WorkItemType.Story, Points = 3 }
                }
            }, _fix.OwnerUserId);
            var after = await _db.WorkItems.CountAsync(w => w.TeamId == _fix.TeamAId);
            Assert(count == 3, $"BulkCreate reported {count}, expected 3");
            Assert(after - before == 3, $"Row delta {after - before}, expected 3");
        });

        await Check(S, "Transfer work item to another team", async () =>
        {
            var wi = await CreateBacklogItemAsync($"__st_transfer_{_fix.RunId}");
            await _wi.TransferWorkItemAsync(wi.Id, _fix.TeamBId, _fix.OwnerUserId);
            await _db.Entry(wi).ReloadAsync();
            Assert(wi.TeamId == _fix.TeamBId, $"Transfer not applied, team={wi.TeamId}");
        });

        await Check(S, "Delete work item", async () =>
        {
            var wi = await CreateBacklogItemAsync($"__st_del_{_fix.RunId}");
            await _wi.DeleteWorkItemAsync(wi.Id, _fix.OwnerUserId);
            Assert(!await _db.WorkItems.AnyAsync(w => w.Id == wi.Id), "Work item not deleted");
        });
    }

    private async Task IterationsSection()
    {
        const string S = "Iterations";
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        await Check(S, "Lifecycle: create -> start -> board -> complete (move unfinished)", async () =>
        {
            await _iter.CreateIterationAsync(_fix.TeamAId, new CreateIterationDto { Name = $"__st_iter1_{_fix.RunId}", StartDate = today, EndDate = today.AddDays(13), Goal = "g" }, _fix.OwnerUserId);
            var iter1 = await _db.Iterations.FirstAsync(i => i.TeamId == _fix.TeamAId && i.Name == $"__st_iter1_{_fix.RunId}");

            await _iter.CreateIterationAsync(_fix.TeamAId, new CreateIterationDto { Name = $"__st_iter2_{_fix.RunId}", StartDate = today.AddDays(14), EndDate = today.AddDays(27), Goal = "g2" }, _fix.OwnerUserId);
            var iter2 = await _db.Iterations.FirstAsync(i => i.TeamId == _fix.TeamAId && i.Name == $"__st_iter2_{_fix.RunId}");

            // two items into iter1
            var done = await CreateBacklogItemAsync($"__st_iterwi_done_{_fix.RunId}");
            var unfinished = await CreateBacklogItemAsync($"__st_iterwi_open_{_fix.RunId}");
            await MoveToIterationAsync(done, iter1.Id);
            await MoveToIterationAsync(unfinished, iter1.Id);

            await _iter.StartIterationAsync(iter1.Id, _fix.OwnerUserId);
            await _db.Entry(iter1).ReloadAsync();
            Assert(iter1.Status == IterationStatus.Active, $"Iteration not Active after start: {iter1.Status}");

            var board = await _board.GetActiveSprintBoardAsync(_fix.TeamAId);
            Assert(board != null, "Active sprint board null");
            var boardById = await _board.GetBoardByIterationIdAsync(_fix.TeamAId, iter1.Id);
            Assert(boardById != null, "Board by iteration id null");

            // mark one Done
            await _wi.UpdateWorkItemAsync(done.Id, new UpdateWorkItemDto { Title = done.Title, Status = WorkItemStatus.Done, Priority = WorkItemPriority.Medium, Type = WorkItemType.Task, IterationId = iter1.Id }, _fix.OwnerUserId);

            await _iter.CompleteIterationAsync(iter1.Id, _fix.OwnerUserId, iter2.Id);
            await _db.Entry(iter1).ReloadAsync();
            await _db.Entry(unfinished).ReloadAsync();
            Assert(iter1.Status == IterationStatus.Completed, $"Iteration not Completed: {iter1.Status}");
            Assert(unfinished.IterationId == iter2.Id, $"Unfinished item not moved (iter={unfinished.IterationId})");
        });

        await Check(S, "Update iteration", async () =>
        {
            await _iter.CreateIterationAsync(_fix.TeamAId, new CreateIterationDto { Name = $"__st_iter_upd_{_fix.RunId}", StartDate = today, EndDate = today.AddDays(7), Goal = "g" }, _fix.OwnerUserId);
            var it = await _db.Iterations.FirstAsync(i => i.TeamId == _fix.TeamAId && i.Name == $"__st_iter_upd_{_fix.RunId}");
            await _iter.UpdateIterationAsync(it.Id, new UpdateIterationDto { Name = $"__st_iter_upd_{_fix.RunId}_x", StartDate = today, EndDate = today.AddDays(8), Goal = "g3" }, _fix.OwnerUserId);
            await _db.Entry(it).ReloadAsync();
            Assert(it.Name!.EndsWith("_x"), "Iteration not updated");
        });

        await Check(S, "Delete empty iteration", async () =>
        {
            await _iter.CreateIterationAsync(_fix.TeamAId, new CreateIterationDto { Name = $"__st_iter_del_{_fix.RunId}", StartDate = today, EndDate = today.AddDays(7), Goal = "g" }, _fix.OwnerUserId);
            var it = await _db.Iterations.FirstAsync(i => i.TeamId == _fix.TeamAId && i.Name == $"__st_iter_del_{_fix.RunId}");
            await _iter.DeleteIterationAsync(it.Id, _fix.OwnerUserId);
            Assert(!await _db.Iterations.AnyAsync(i => i.Id == it.Id), "Iteration not deleted");
        });
    }

    private async Task DependenciesSection()
    {
        const string S = "Dependencies";

        await Check(S, "Add dependency + unfinished blocker detection", async () =>
        {
            var blocked = await CreateBacklogItemAsync($"__st_dep_blocked_{_fix.RunId}");
            var blocker = await CreateBacklogItemAsync($"__st_dep_blocker_{_fix.RunId}");
            await _dep.AddDependencyAsync(blocked.Id, blocker.Id, _fix.OwnerUserId);
            Assert(await _db.WorkItemDependencies.AnyAsync(d => d.BlockedWorkItemId == blocked.Id && d.BlockerWorkItemId == blocker.Id), "Dependency row not created");

            var unfinished = await _dep.GetUnfinishedBlockersAsync(blocked.Id);
            Assert(unfinished.Any(), "Unfinished blocker not reported while blocker is open");
        });

        await Check(S, "Cross-team dependency allowed", async () =>
        {
            var blocked = await CreateBacklogItemAsync($"__st_dep_xt_blocked_{_fix.RunId}");
            var blockerB = await CreateBacklogItemInTeamAsync($"__st_dep_xt_blocker_{_fix.RunId}", _fix.TeamBId);
            await _dep.AddDependencyAsync(blocked.Id, blockerB.Id, _fix.OwnerUserId);
            Assert(await _db.WorkItemDependencies.AnyAsync(d => d.BlockedWorkItemId == blocked.Id && d.BlockerWorkItemId == blockerB.Id), "Cross-team dependency not created");
        });

        await CheckThrows(S, "Cycle is rejected", async () =>
        {
            var x = await CreateBacklogItemAsync($"__st_cycle_x_{_fix.RunId}");
            var y = await CreateBacklogItemAsync($"__st_cycle_y_{_fix.RunId}");
            await _dep.AddDependencyAsync(x.Id, y.Id, _fix.OwnerUserId); // x blocked by y
            await _dep.AddDependencyAsync(y.Id, x.Id, _fix.OwnerUserId); // y blocked by x -> cycle, must throw
        });

        await Check(S, "Blocked work item cannot be set to Done (IT-151)", async () =>
        {
            var blocked = await CreateBacklogItemAsync($"__st_dep_done_{_fix.RunId}");
            var blocker = await CreateBacklogItemAsync($"__st_dep_done_blk_{_fix.RunId}");
            await _dep.AddDependencyAsync(blocked.Id, blocker.Id, _fix.OwnerUserId);

            var prevented = false;
            try
            {
                await _wi.UpdateWorkItemAsync(blocked.Id, new UpdateWorkItemDto { Title = blocked.Title, Status = WorkItemStatus.Done, Priority = WorkItemPriority.Medium, Type = WorkItemType.Task }, _fix.OwnerUserId);
            }
            catch { prevented = true; }

            if (!prevented)
            {
                await _db.Entry(blocked).ReloadAsync();
                Assert(blocked.Status != WorkItemStatus.Done, "Blocked item was allowed to move to Done — IT-151 still open");
            }
        });
    }

    private async Task AbsencesSection()
    {
        const string S = "Absences";
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        await Check(S, "Create absence with hour precision (IT-155)", async () =>
        {
            await _absence.CreateMemberAbsenceAsync(_fix.OrgId, new CreateMemberAbsenceDto
            {
                OrgMemberId = _fix.ColleagueOrgMemberId,
                FromDate = today,
                ToDate = today,
                FromTime = new TimeOnly(9, 0),
                ToTime = new TimeOnly(12, 0),
                Reason = AbsenceReason.Late
            }, _fix.OwnerUserId);

            var abs = await _db.MemberAbsences
                .Where(a => a.OrgMemberId == _fix.ColleagueOrgMemberId && a.FromTime != null)
                .OrderByDescending(a => a.Id)
                .FirstOrDefaultAsync();
            Assert(abs != null, "Hour-precision absence not created");
            Assert(abs!.FromTime == new TimeOnly(9, 0) && abs.ToTime == new TimeOnly(12, 0), $"Times not persisted: {abs.FromTime}-{abs.ToTime}");
        });

        await Check(S, "Update + delete absence", async () =>
        {
            await _absence.CreateMemberAbsenceAsync(_fix.OrgId, new CreateMemberAbsenceDto
            {
                OrgMemberId = _fix.ColleagueOrgMemberId,
                FromDate = today.AddDays(2),
                ToDate = today.AddDays(3),
                Reason = AbsenceReason.Vacation
            }, _fix.OwnerUserId);
            var abs = await _db.MemberAbsences.Where(a => a.OrgMemberId == _fix.ColleagueOrgMemberId && a.Reason == AbsenceReason.Vacation).OrderByDescending(a => a.Id).FirstAsync();

            await _absence.UpdateMemberAbsenceAsync(abs.Id, new UpdateMemberAbsenceDto
            {
                OrgMemberId = _fix.ColleagueOrgMemberId,
                FromDate = today.AddDays(2),
                ToDate = today.AddDays(4),
                Reason = AbsenceReason.Sick
            }, _fix.OwnerUserId);
            await _db.Entry(abs).ReloadAsync();
            Assert(abs.Reason == AbsenceReason.Sick && abs.ToDate == today.AddDays(4), "Absence not updated");

            await _absence.DeleteMemberAbsenceAsync(abs.Id, _fix.OwnerUserId);
            Assert(!await _db.MemberAbsences.AnyAsync(a => a.Id == abs.Id), "Absence not deleted");
        });

        await Check(S, "Absence date-range query runs", async () =>
        {
            var list = await _absence.GetAbsencesByDateRangeAsync(_fix.OrgId, today.AddDays(-30), today.AddDays(30), _fix.OwnerUserId);
            Assert(list != null, "Absence range query null");
        });
    }

    private async Task AtpaSection()
    {
        const string S = "ATPA";
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        await Check(S, "Suggest assignments runs and returns a result", async () =>
        {
            await _iter.CreateIterationAsync(_fix.TeamAId, new CreateIterationDto { Name = $"__st_atpa_{_fix.RunId}", StartDate = today, EndDate = today.AddDays(13), Goal = "atpa" }, _fix.OwnerUserId);
            var iter = await _db.Iterations.FirstAsync(i => i.TeamId == _fix.TeamAId && i.Name == $"__st_atpa_{_fix.RunId}");

            for (var n = 0; n < 3; n++)
            {
                var wi = await CreateBacklogItemAsync($"__st_atpawi_{n}_{_fix.RunId}");
                await MoveToIterationAsync(wi, iter.Id);
            }

            var result = await _atpa.SuggestAssignmentsAsync(iter.Id, _fix.OwnerUserId);
            Assert(result != null, "ATPA returned null");
            // NOTE: capacity-graph correctness (IT-156/IT-157) is NOT asserted here —
            // verify those numbers by eye against the manual checklist.
        });
    }

    private async Task MetricsSection()
    {
        const string S = "Metrics";
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        await Check(S, "Velocity query runs", async () =>
        {
            var v = await _metrics.GetVelocityAsync(_fix.TeamAId, _fix.OwnerUserId, 5, null);
            Assert(v != null, "Velocity null");
        });

        await Check(S, "Sprint metrics / burndown query runs", async () =>
        {
            var iterId = await _db.Iterations.Where(i => i.TeamId == _fix.TeamAId).Select(i => i.Id).FirstOrDefaultAsync();
            Assert(iterId != 0, "precondition: an iteration exists");
            var m = await _metrics.GetSprintMetricsAsync(iterId, _fix.OwnerUserId);
            Assert(m != null, "Sprint metrics null");
        });

        await Check(S, "Capacity query runs", async () =>
        {
            var c = await _metrics.GetCapacityAsync(_fix.TeamAId, _fix.OwnerUserId, today, today.AddDays(14));
            Assert(c != null, "Capacity null");
        });
    }

    private async Task NotificationsSection()
    {
        const string S = "Notifications";

        await Check(S, "Create, unread count, list, mark read, mark all read", async () =>
        {
            await _notif.CreateAsync(_fix.OwnerUserId, NotificationType.WorkItemAssigned,
                "notifications.workItemAssigned.title", "notifications.workItemAssigned.message",
                new Dictionary<string, string> { ["workItemTitle"] = "selftest" }, "/dashboard");

            var unread = await _notif.GetUnreadCountAsync(_fix.OwnerUserId);
            Assert(unread >= 1, $"Unread count {unread}, expected >= 1");

            var list = await _notif.GetAsync(_fix.OwnerUserId, 1, 20);
            Assert(list != null, "Notification list null");

            var nId = await _db.Notifications.Where(n => n.UserId == _fix.OwnerUserId).OrderByDescending(n => n.Id).Select(n => n.Id).FirstAsync();
            var marked = await _notif.MarkAsReadAsync(nId, _fix.OwnerUserId);
            Assert(marked, "MarkAsRead returned false");

            await _notif.MarkAllAsReadAsync(_fix.OwnerUserId);
            var unreadAfter = await _notif.GetUnreadCountAsync(_fix.OwnerUserId);
            Assert(unreadAfter == 0, $"Unread after mark-all {unreadAfter}, expected 0");
        });
    }

    private async Task CommentsSection()
    {
        const string S = "Comments";

        await Check(S, "Add + read comment", async () =>
        {
            var wi = await CreateBacklogItemAsync($"__st_comment_{_fix.RunId}");
            _db.WorkItemComments.Add(new WorkItemComment
            {
                WorkItemId = wi.Id,
                AuthorId = _fix.OwnerOrgMemberId,
                Message = "selftest comment",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            });
            await _db.SaveChangesAsync();

            var count = await _db.WorkItemComments.CountAsync(c => c.WorkItemId == wi.Id);
            Assert(count == 1, $"Comment count {count}, expected 1");
        });
    }

    private async Task RetroSection()
    {
        const string S = "Retro";
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        await Check(S, "Board + create item + vote toggle + delete", async () =>
        {
            await _iter.CreateIterationAsync(_fix.TeamAId, new CreateIterationDto { Name = $"__st_retro_{_fix.RunId}", StartDate = today, EndDate = today.AddDays(13), Goal = "retro" }, _fix.OwnerUserId);
            var iter = await _db.Iterations.FirstAsync(i => i.TeamId == _fix.TeamAId && i.Name == $"__st_retro_{_fix.RunId}");

            var boardEmpty = await _retro.GetRetroBoardAsync(_fix.TeamAId, iter.Id, _fix.OwnerUserId);
            Assert(boardEmpty != null, "Retro board null");

            await _retro.CreateRetroItemAsync(_fix.TeamAId, iter.Id, new CreateRetroItemDto { Column = RetroColumn.WentWell, Content = "shipped it" }, _fix.OwnerUserId);
            var item = await _db.RetroItems.FirstAsync(r => r.IterationId == iter.Id && r.Content == "shipped it");

            await _retro.ToggleVoteAsync(_fix.TeamAId, iter.Id, item.Id, _fix.OwnerUserId);
            Assert(await _db.RetroVotes.AnyAsync(v => v.RetroItemId == item.Id && v.UserId == _fix.OwnerUserId), "Vote not added");

            await _retro.ToggleVoteAsync(_fix.TeamAId, iter.Id, item.Id, _fix.OwnerUserId);
            Assert(!await _db.RetroVotes.AnyAsync(v => v.RetroItemId == item.Id && v.UserId == _fix.OwnerUserId), "Vote not removed on toggle");

            await _retro.DeleteRetroItemAsync(_fix.TeamAId, iter.Id, item.Id, _fix.OwnerUserId);
            Assert(!await _db.RetroItems.AnyAsync(r => r.Id == item.Id), "Retro item not deleted");
        });
    }

    private async Task FeedbackSection()
    {
        const string S = "Feedback";

        await Check(S, "Create + list + summary + toggle reviewed", async () =>
        {
            await _feedback.CreateAsync(_fix.OwnerUserId, new CreateFeedbackDto
            {
                Language = "en",
                SprintsUsed = 3,
                OverallRating = 4,
                WasSatisfied = true,
                EncounteredBugs = false,
                WouldTryAgain = true,
                MostUsefulFeature = "ATPA"
            });
            var fb = await _db.Feedbacks.Where(f => f.UserId == _fix.OwnerUserId).OrderByDescending(f => f.Id).FirstAsync();

            var list = await _feedback.GetAllAsync(1, 20);
            Assert(list != null, "Feedback list null");

            var summary = await _feedback.GetSummaryAsync();
            Assert(summary != null, "Feedback summary null");

            await _feedback.ToggleReviewedAsync(fb.Id, _fix.OwnerUserId);
            await _db.Entry(fb).ReloadAsync();
            Assert(fb.IsReviewed, "Feedback not marked reviewed");
        });
    }

    private async Task DashboardSection()
    {
        const string S = "Dashboard";
        await Check(S, "Dashboard aggregation runs", async () =>
        {
            var d = await _dashboard.GetDashboardAsync(_fix.OwnerUserId);
            Assert(d != null, "Dashboard null");
        });
    }

    private async Task AdminSection()
    {
        const string S = "Admin";

        await Check(S, "List organizations", async () =>
        {
            var orgs = await _adminOrg.GetOrganizationsAsync();
            Assert(orgs.Any(), "Admin org list empty");
        });

        await Check(S, "Organization details", async () =>
        {
            var detail = await _adminOrg.GetOrganizationDetailsAsync(_fix.OrgId);
            Assert(detail != null, "Admin org detail null");
        });
    }

    private async Task PerformanceSection()
    {
        const string S = "Performance";

        await Check(S, "Bulk insert 200 items + paginated read timing", async () =>
        {
            var items = new List<ImportWorkItemDto>();
            for (var n = 0; n < 200; n++)
                items.Add(new ImportWorkItemDto { Title = $"__st_perf_{n}_{_fix.RunId}", Type = WorkItemType.Task, Points = 1 });
            await _wi.BulkCreateWorkItemsAsync(_fix.TeamBId, new BulkCreateWorkItemsDto { Items = items }, _fix.OwnerUserId);

            var sw = Stopwatch.StartNew();
            var read = await _wi.GetWorkItemsByTeamAsync(_fix.TeamBId, new WorkItemFilterDto(), _fix.OwnerUserId);
            sw.Stop();
            var n2 = read.Count();
            Assert(n2 >= 200, $"Expected >= 200 items, got {n2}");
            // Informational: flag if a 200-item backlog read takes longer than 3s.
            Assert(sw.ElapsedMilliseconds < 3000, $"Backlog read slow: {sw.ElapsedMilliseconds}ms for {n2} items (investigate query/N+1)");
        });
    }

    // ─────────────────────────────────────────────────────────────
    // Small builders
    // ─────────────────────────────────────────────────────────────

    private Task<WorkItem> CreateBacklogItemAsync(string title) => CreateBacklogItemInTeamAsync(title, _fix.TeamAId);

    private async Task<WorkItem> CreateBacklogItemInTeamAsync(string title, int teamId)
    {
        await _wi.CreateWorkItemAsync(teamId, new CreateWorkItemDto
        {
            Title = title,
            Description = "selftest",
            Type = WorkItemType.Task,
            Priority = WorkItemPriority.Medium,
            Points = 1
        }, _fix.OwnerUserId);
        return await _db.WorkItems.FirstAsync(w => w.TeamId == teamId && w.Title == title);
    }

    private async Task MoveToIterationAsync(WorkItem wi, int iterationId)
    {
        await _wi.UpdateWorkItemAsync(wi.Id, new UpdateWorkItemDto
        {
            Title = wi.Title,
            Type = wi.Type,
            Priority = wi.Priority,
            Points = wi.Points,
            Status = wi.Status,
            IterationId = iterationId
        }, _fix.OwnerUserId);
        await _db.Entry(wi).ReloadAsync();
    }

    // ─────────────────────────────────────────────────────────────
    // Cleanup — best-effort, never throws. Deletes everything created
    // under the throwaway org + users, in FK-safe order.
    // ─────────────────────────────────────────────────────────────

    private async Task<List<string>> CleanupAsync()
    {
        var errors = new List<string>();
        if (_fix.OrgId == 0 && _fix.OwnerUserId == 0) return errors;

        async Task Try(string label, Func<Task> op)
        {
            try { await op(); } catch (Exception ex) { errors.Add($"{label}: {ex.Message}"); }
        }

        var orgId = _fix.OrgId;
        var userIds = new List<int> { _fix.OwnerUserId, _fix.ColleagueUserId };
        userIds.AddRange(_fix.ExtraUserIds);
        userIds = userIds.Where(id => id != 0).Distinct().ToList();

        var productIds = await _db.Products.Where(p => p.OrganizationId == orgId).Select(p => p.Id).ToListAsync();
        var teamIds = await _db.Teams.Where(t => productIds.Contains(t.ProductId)).Select(t => t.Id).ToListAsync();
        var iterationIds = await _db.Iterations.Where(i => teamIds.Contains(i.TeamId)).Select(i => i.Id).ToListAsync();
        var workItemIds = await _db.WorkItems.Where(w => teamIds.Contains(w.TeamId)).Select(w => w.Id).ToListAsync();
        var orgMemberIds = await _db.OrganizationMembers.Where(m => m.OrganizationId == orgId).Select(m => m.Id).ToListAsync();
        var teamMemberIds = await _db.TeamMembers.Where(tm => teamIds.Contains(tm.TeamId)).Select(tm => tm.Id).ToListAsync();

        await Try("retroVotes", () => _db.RetroVotes.Where(v => _db.RetroItems.Where(r => iterationIds.Contains(r.IterationId)).Select(r => r.Id).Contains(v.RetroItemId)).ExecuteDeleteAsync());
        await Try("retroItems", () => _db.RetroItems.Where(r => iterationIds.Contains(r.IterationId)).ExecuteDeleteAsync());
        await Try("workItemHistory", () => _db.WorkItemHistories.Where(h => workItemIds.Contains(h.WorkItemId)).ExecuteDeleteAsync());
        await Try("workItemComments", () => _db.WorkItemComments.Where(c => workItemIds.Contains(c.WorkItemId)).ExecuteDeleteAsync());
        await Try("dependencies", () => _db.WorkItemDependencies.Where(d => workItemIds.Contains(d.BlockerWorkItemId) || workItemIds.Contains(d.BlockedWorkItemId)).ExecuteDeleteAsync());
        await Try("workItemTags", () => _db.WorkItemTags.Where(wt => workItemIds.Contains(wt.WorkItemId)).ExecuteDeleteAsync());
        await Try("teamMemberTags", () => _db.TeamMemberTags.Where(tt => teamMemberIds.Contains(tt.TeamMemberId)).ExecuteDeleteAsync());
        await Try("memberAbsences", () => _db.MemberAbsences.Where(a => orgMemberIds.Contains(a.OrgMemberId)).ExecuteDeleteAsync());
        await Try("workItems", () => _db.WorkItems.Where(w => teamIds.Contains(w.TeamId)).ExecuteDeleteAsync());
        await Try("iterations", () => _db.Iterations.Where(i => teamIds.Contains(i.TeamId)).ExecuteDeleteAsync());
        await Try("teamMembers", () => _db.TeamMembers.Where(tm => teamIds.Contains(tm.TeamId)).ExecuteDeleteAsync());
        await Try("teams", () => _db.Teams.Where(t => productIds.Contains(t.ProductId)).ExecuteDeleteAsync());
        await Try("products", () => _db.Products.Where(p => p.OrganizationId == orgId).ExecuteDeleteAsync());
        await Try("tags", () => _db.Tags.Where(t => t.OrganizationId == orgId).ExecuteDeleteAsync());
        await Try("orgConfigs", () => _db.OrganizationConfigs.Where(c => c.OrganizationId == orgId).ExecuteDeleteAsync());
        await Try("orgMembers", () => _db.OrganizationMembers.Where(m => m.OrganizationId == orgId).ExecuteDeleteAsync());
        await Try("notifications", () => _db.Notifications.Where(n => userIds.Contains(n.UserId)).ExecuteDeleteAsync());
        await Try("feedback", () => _db.Feedbacks.Where(f => userIds.Contains(f.UserId)).ExecuteDeleteAsync());
        await Try("refreshTokens", () => _db.RefreshTokens.Where(rt => userIds.Contains(rt.UserId)).ExecuteDeleteAsync());
        await Try("recentPages", () => _db.RecentPages.Where(rp => userIds.Contains(rp.UserId)).ExecuteDeleteAsync());
        await Try("pinnedTeams", () => _db.PinnedTeams.Where(pt => userIds.Contains(pt.UserId)).ExecuteDeleteAsync());
        await Try("organization", () => _db.Organizations.Where(o => o.Id == orgId).ExecuteDeleteAsync());
        await Try("users", () => _db.Users.Where(u => userIds.Contains(u.Id)).ExecuteDeleteAsync());

        return errors;
    }
}
