using iterimApi.Data;
using iterimApi.Models.Entities;
using iterimApi.Models.Enums;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace iterimApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TestController : ControllerBase
{
    private readonly AppDbContext _db;

    public TestController(AppDbContext db)
    {
        _db = db;
    }

    [HttpPost("seed")]
    public async Task<IActionResult> Seed()
    {
        // Create a test user
        var user = new User
        {
            Email = "test@iterim.dev",
            Name = "Test User",
            PasswordHash = "not-a-real-hash",
            Role = UserRole.Admin
        };
        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        // Create an organization
        var org = new Organization
        {
            Name = "Test Organization",
            Slug = "test-org",
            CreatedBy = user.Id,
            UpdatedBy = user.Id
        };
        _db.Organizations.Add(org);
        await _db.SaveChangesAsync();

        // Add user as org member
        var member = new OrganizationMember
        {
            OrganizationId = org.Id,
            UserId = user.Id,
            Email = user.Email,
            Role = OrgMemberRole.Admin,
            Status = OrgMemberStatus.Active,
            JoinedAt = DateTime.UtcNow
        };
        _db.OrganizationMembers.Add(member);
        await _db.SaveChangesAsync();

        return Ok(new
        {
            message = "Seed data created",
            userId = user.Id,
            organizationId = org.Id,
            memberId = member.Id
        });
    }

    [HttpGet("verify")]
    public async Task<IActionResult> Verify()
    {
        var users = await _db.Users.CountAsync();
        var orgs = await _db.Organizations.CountAsync();
        var members = await _db.OrganizationMembers
            .Include(m => m.User)
            .Include(m => m.Organization)
            .Select(m => new
            {
                m.Id,
                UserName = m.User.Name,
                OrgName = m.Organization.Name,
                m.Role
            })
            .ToListAsync();

        return Ok(new
        {
            userCount = users,
            organizationCount = orgs,
            members
        });
    }

    [HttpDelete("cleanup")]
    public async Task<IActionResult> Cleanup()
    {
        _db.OrganizationMembers.RemoveRange(_db.OrganizationMembers);
        _db.Organizations.RemoveRange(_db.Organizations);
        _db.Users.RemoveRange(_db.Users);
        await _db.SaveChangesAsync();

        return Ok(new { message = "All test data cleaned up" });
    }
}