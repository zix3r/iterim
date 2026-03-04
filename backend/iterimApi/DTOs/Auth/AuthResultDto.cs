namespace iterimApi.DTOs.Auth;

public class AuthResultDto
{
    public bool Success { get; set; }
    public IEnumerable<string> Errors { get; set; } = [];

    public static AuthResultDto Ok() => new() { Success = true };

    public static AuthResultDto Fail(params string[] errors) =>
        new() { Success = false, Errors = errors };
}
