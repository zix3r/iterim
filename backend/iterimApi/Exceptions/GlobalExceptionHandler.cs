using Microsoft.AspNetCore.Diagnostics;

namespace iterimApi.Exceptions;

public class GlobalExceptionHandler : IExceptionHandler
{
    private readonly ILogger<GlobalExceptionHandler> _logger;

    public GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger) => _logger = logger;

    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext, Exception exception, CancellationToken cancellationToken)
    {
        var (status, code, message) = Map(exception);

        if (status >= 500)
            _logger.LogError(exception, "Unhandled exception on {Path}", httpContext.Request.Path);

        httpContext.Response.StatusCode = status;

        // Keep the existing { message } shape; add a stable { code }. Carry blockers for the dependency case.
        object payload = exception is BlockedByDependenciesException blocked
            ? new { code, message, status, blockers = blocked.Blockers }
            : new { code, message, status };

        await httpContext.Response.WriteAsJsonAsync(payload, cancellationToken);
        return true;
    }

    private static (int status, string code, string message) Map(Exception ex) => ex switch
    {
        BlockedByDependenciesException => (400, ErrorCodes.BlockedByDependencies, ex.Message),
        UnauthorizedAccessException    => (403, ErrorCodes.Forbidden, ex.Message),
        KeyNotFoundException           => (404, ErrorCodes.NotFound, ex.Message),
        ArgumentException              => (400, ErrorCodes.Validation, ex.Message),
        InvalidOperationException      => (400, ErrorCodes.Validation, ex.Message),
        _                              => (500, ErrorCodes.Internal, "An unexpected error occurred."),
    };
}