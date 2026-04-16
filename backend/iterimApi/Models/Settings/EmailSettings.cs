namespace iterimApi.Models.Settings;

public class EmailSettings
{
    public string Provider { get; set; } = "Smtp"; // "Smtp" | "Resend" | "SendGrid"
    public string FromAddress { get; set; } = string.Empty;
    public string FromName { get; set; } = "Iterim";
    public string FrontendBaseUrl { get; set; } = string.Empty;

    // SMTP (Gmail, etc.)
    public SmtpSettings? Smtp { get; set; }

    // Resend
    public string? ResendApiKey { get; set; }

    // SendGrid
    public string? SendGridApiKey { get; set; }
}

public class SmtpSettings
{
    public string Host { get; set; } = string.Empty;
    public int Port { get; set; } = 587;
    public bool UseSsl { get; set; } = false;
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}
