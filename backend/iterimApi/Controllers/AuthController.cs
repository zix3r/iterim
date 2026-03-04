using System.Security.Claims;
using iterimApi.DTOs.Auth;
using iterimApi.Helpers;
using iterimApi.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace iterimApi.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    // POST /api/auth/register
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequestDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var (result, user) = await _authService.RegisterAsync(dto);

        if (!result.Success)
        {
            // 409 if email already in use
            if (result.Errors.Any(e => e.Contains("already in use")))
                return Conflict(new { errors = result.Errors });

            return BadRequest(new { errors = result.Errors });
        }

        return Ok(user);
    }

    // POST /api/auth/login
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequestDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var (result, user) = await _authService.LoginAsync(dto);

        if (!result.Success)
            return Unauthorized(new { errors = result.Errors });

        return Ok(user);
    }

    // POST /api/auth/refresh
    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh()
    {
        var refreshToken = CookieHelper.GetRefreshToken(Request);

        if (string.IsNullOrEmpty(refreshToken))
            return Unauthorized(new { errors = new[] { "Refresh token is missing." } });

        var result = await _authService.RefreshTokenAsync(refreshToken);

        if (!result.Success)
            return Unauthorized(new { errors = result.Errors });

        return Ok();
    }

    // POST /api/auth/logout
    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        var refreshToken = CookieHelper.GetRefreshToken(Request);

        if (!string.IsNullOrEmpty(refreshToken))
            await _authService.LogoutAsync(refreshToken);
        else
            CookieHelper.ClearAuthCookies(Response);

        return Ok();
    }

    // GET /api/auth/me
    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> Me()
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier)
                          ?? User.FindFirstValue("sub");

        if (userIdClaim is null || !int.TryParse(userIdClaim, out var userId))
            return Unauthorized(new { errors = new[] { "Invalid token." } });

        var user = await _authService.GetCurrentUserAsync(userId);

        if (user is null)
            return NotFound(new { errors = new[] { "User not found." } });

        return Ok(user);
    }
}
