using System.Security.Claims;
using iterimApi.DTOs.Auth;
using iterimApi.Helpers;
using iterimApi.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

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

    [HttpPost("register")]
    [EnableRateLimiting("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequestDto dto)
    {
        if (!ModelState.IsValid) return ValidationProblem(ModelState);

        var (result, user) = await _authService.RegisterAsync(dto);
        if (!result.Success)
        {
            if (result.Errors.Any(e => e.Contains("already in use")))
                return Conflict(new { errors = result.Errors });
            return BadRequest(new { errors = result.Errors });
        }

        return Ok(user);
    }

    [HttpPost("login")]
    [EnableRateLimiting("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequestDto dto)
    {
        if (!ModelState.IsValid) return ValidationProblem(ModelState);

        var (result, user) = await _authService.LoginAsync(dto);
        if (!result.Success)
        {
            // Atskirti 403 (nepatvirtintas el. paštas) nuo 401 (blogas slaptažodis)
            if (result.Errors.Any(e => e.Contains("confirm your email")))
                return StatusCode(403, new { errors = result.Errors });
            
            if (result.Errors.Any(e => e.Contains("blocked")))
                return StatusCode(403, new { errors = result.Errors });

            return Unauthorized(new { errors = result.Errors });
        }

        return Ok(user);
    }

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

    // ── Email confirmation ────────────────────────────────────

    /// <summary>
    /// Patvirtina el. paštą pagal URL token.
    /// Frontend: GET /confirm-email?token=xxx → POST čia
    /// </summary>
    [HttpPost("confirm-email")]
    public async Task<IActionResult> ConfirmEmail([FromBody] ConfirmEmailRequestDto dto)
    {
        if (!ModelState.IsValid) return ValidationProblem(ModelState);

        var result = await _authService.ConfirmEmailAsync(dto.Token);
        if (!result.Success)
            return BadRequest(new { errors = result.Errors });

        return Ok(new { message = "Email confirmed successfully." });
    }

    /// <summary>
    /// Pakartotinai siunčia patvirtinimo el. laišką.
    /// Visada grąžina 200 (neskleidžia, ar vartotojas egzistuoja).
    /// </summary>
    [HttpPost("resend-confirmation")]
    [EnableRateLimiting("register")] // naudoti tą patį rate limit kaip register
    public async Task<IActionResult> ResendConfirmation([FromBody] ResendConfirmationRequestDto dto)
    {
        if (!ModelState.IsValid) return ValidationProblem(ModelState);

        await _authService.ResendConfirmationAsync(dto.Email);
        return Ok(new { message = "If that email exists and is unconfirmed, a new confirmation link has been sent." });
    }

    // ── Password reset ────────────────────────────────────────

    /// <summary>
    /// Priima el. paštą ir siunčia slaptažodžio atkūrimo nuorodą.
    /// Visada grąžina 200 — neskleidžia, ar el. paštas egzistuoja.
    /// </summary>
    [HttpPost("forgot-password")]
    [EnableRateLimiting("register")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequestDto dto)
    {
        if (!ModelState.IsValid) return ValidationProblem(ModelState);

        await _authService.ForgotPasswordAsync(dto.Email);
        return Ok(new { message = "If that email is registered, a password reset link has been sent." });
    }

    /// <summary>
    /// Priima token + naują slaptažodį, validuoja ir atnaujina.
    /// </summary>
    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequestDto dto)
    {
        if (!ModelState.IsValid) return ValidationProblem(ModelState);

        var result = await _authService.ResetPasswordAsync(dto);
        if (!result.Success)
            return BadRequest(new { errors = result.Errors });

        return Ok(new { message = "Password has been reset successfully. Please log in." });
    }
}
