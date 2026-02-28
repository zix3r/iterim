namespace iterimApi.Helpers;

public static class CookieHelper
{
    private const string AccessTokenCookie = "access_token";
    private const string RefreshTokenCookie = "refresh_token";

    public static void SetAccessTokenCookie(HttpResponse response, string token, int expirationMinutes)
    {
        response.Cookies.Append(AccessTokenCookie, token, new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Strict,
            Expires = DateTime.UtcNow.AddMinutes(expirationMinutes)
        });
    }

    public static void SetRefreshTokenCookie(HttpResponse response, string token, int expirationDays)
    {
        response.Cookies.Append(RefreshTokenCookie, token, new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Strict,
            Path = "/api/auth",
            Expires = DateTime.UtcNow.AddDays(expirationDays)
        });
    }

    public static void ClearAuthCookies(HttpResponse response)
    {
        response.Cookies.Delete(AccessTokenCookie, new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Strict
        });

        response.Cookies.Delete(RefreshTokenCookie, new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Strict,
            Path = "/api/auth"
        });
    }

    public static string? GetAccessToken(HttpRequest request)
    {
        return request.Cookies[AccessTokenCookie];
    }

    public static string? GetRefreshToken(HttpRequest request)
    {
        return request.Cookies[RefreshTokenCookie];
    }
}