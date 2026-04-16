namespace iterimApi.Helpers;

public static class FriendlyErrorMessageHelper
{
    public static string ForRequest(HttpRequest request)
    {
        var method = request.Method.ToUpperInvariant();
        var path = request.Path.Value?.ToLowerInvariant() ?? string.Empty;

        if (method == "POST" && IsMatch(path, "api", "organizations", "{id}", "products"))
            return "Failed to create product.";

        if (method == "PUT" && IsMatch(path, "api", "products", "{id}"))
            return "Failed to update product.";

        if (method == "DELETE" && IsMatch(path, "api", "products", "{id}"))
            return "Failed to delete product.";

        if (method == "POST" && IsMatch(path, "api", "teams", "{id}", "iterations"))
            return "Failed to create iteration.";

        if (method == "PUT" && IsMatch(path, "api", "iterations", "{id}"))
            return "Failed to update iteration.";

        if (method == "DELETE" && IsMatch(path, "api", "organizations", "{id}"))
            return "Failed to delete organization.";

        return "Request failed. Please try again.";
    }

    private static bool IsMatch(string path, params string[] template)
    {
        var segments = path.Trim('/').Split('/', StringSplitOptions.RemoveEmptyEntries);
        if (segments.Length != template.Length)
            return false;

        for (var i = 0; i < template.Length; i++)
        {
            if (template[i] == "{id}")
            {
                if (!int.TryParse(segments[i], out _))
                    return false;
                continue;
            }

            if (!string.Equals(segments[i], template[i], StringComparison.OrdinalIgnoreCase))
                return false;
        }

        return true;
    }
}
