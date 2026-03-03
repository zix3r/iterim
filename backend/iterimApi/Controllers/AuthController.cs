using iterimApi.Data;
using iterimApi.Helpers;
using iterimApi.Models.Settings;
using iterimApi.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace iterimApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IJwtService _jwtService;
    private readonly JwtSettings _jwtSettings;

    public AuthController(AppDbContext db, IJwtService jwtService, IOptions<JwtSettings> jwtSettings)
    {
        _db = db;
        _jwtService = jwtService;
        _jwtSettings = jwtSettings.Value;
    }

    /// <summary>
    /// Test login - returns JWT token for any user by email
    /// WARNING: FOR TESTING ONLY - NOT SECURE
    /// </summary>
    [HttpPost("test-login")]
    public async Task<IActionResult> TestLogin([FromBody] TestLoginRequest request)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
        
        if (user == null)
        {
            return NotFound(new { message = "User not found" });
        }

        var token = _jwtService.GenerateAccessToken(user);
        
        // Set cookie
        CookieHelper.SetAccessTokenCookie(Response, token, _jwtSettings.AccessTokenExpirationMinutes);

        return Ok(new
        {
            accessToken = token,
            user = new
            {
                user.Id,
                user.Email,
                user.Name,
                user.Role
            }
        });
    }
}

public class TestLoginRequest
{
    public string Email { get; set; } = string.Empty;
}
