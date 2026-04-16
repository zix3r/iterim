using System.ComponentModel.DataAnnotations;
using System.Net;
using System.Runtime.ExceptionServices;
using System.Text.Json;
using iterimApi.Exceptions;
using iterimApi.Helpers;

namespace iterimApi.Middleware;

public class GlobalExceptionHandlerMiddleware
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionHandlerMiddleware> _logger;

    public GlobalExceptionHandlerMiddleware(
        RequestDelegate next,
        ILogger<GlobalExceptionHandlerMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception ex)
    {
        if (context.Response.HasStarted)
        {
            _logger.LogError(ex, "Response has already started, could not write error body.");
            ExceptionDispatchInfo.Capture(ex).Throw();
        }

        HttpStatusCode statusCode;
        object payload;

        switch (ex)
        {
            case ConflictException:
                statusCode = HttpStatusCode.Conflict;
                payload = new { message = ex.Message };
                break;
            case KeyNotFoundException:
                statusCode = HttpStatusCode.NotFound;
                payload = new { message = ex.Message };
                break;
            case UnauthorizedAccessException:
                statusCode = HttpStatusCode.Forbidden;
                payload = new { message = ex.Message };
                break;
            case ValidationException:
                statusCode = HttpStatusCode.BadRequest;
                payload = new { errors = new Dictionary<string, string[]> { ["general"] = [ex.Message] } };
                break;
            case InvalidOperationException:
            case ArgumentException:
                statusCode = HttpStatusCode.BadRequest;
                payload = new { message = ex.Message };
                break;
            default:
                statusCode = HttpStatusCode.InternalServerError;
                payload = new
                {
                    message = FriendlyErrorMessageHelper.ForRequest(context.Request),
                    traceId = context.TraceIdentifier
                };
                break;
        }

        if ((int)statusCode >= 500)
        {
            _logger.LogError(ex, "Unhandled exception for {Method} {Path}. TraceId: {TraceId}",
                context.Request.Method,
                context.Request.Path,
                context.TraceIdentifier);
        }

        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)statusCode;

        await context.Response.WriteAsync(JsonSerializer.Serialize(payload, JsonOptions));
    }
}