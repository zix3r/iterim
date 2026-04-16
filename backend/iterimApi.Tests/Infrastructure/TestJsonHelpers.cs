using System.Text.Json;

namespace iterimApi.Tests.Infrastructure;

public static class TestJsonHelpers
{
    public static async Task<JsonDocument> ReadJsonAsync(HttpResponseMessage response)
    {
        var payload = await response.Content.ReadAsStringAsync();
        return JsonDocument.Parse(payload);
    }

    public static string? ExtractCookieValue(IEnumerable<string> setCookieHeaders, string cookieName)
    {
        var prefix = cookieName + "=";

        foreach (var header in setCookieHeaders)
        {
            if (!header.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
                continue;

            var firstPart = header.Split(';', 2)[0];
            return firstPart.Substring(prefix.Length);
        }

        return null;
    }
}
