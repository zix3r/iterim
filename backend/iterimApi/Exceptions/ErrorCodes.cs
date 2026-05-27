namespace iterimApi.Exceptions;

public static class ErrorCodes
{
    public const string Unauthenticated      = "UNAUTHENTICATED";
    public const string Forbidden            = "FORBIDDEN";
    public const string NotFound             = "NOT_FOUND";
    public const string Validation           = "VALIDATION";
    public const string Conflict             = "CONFLICT";
    public const string BlockedByDependencies = "BLOCKED_BY_DEPENDENCIES";
    public const string Internal             = "INTERNAL";
}