using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using iterimApi.Helpers;
using iterimApi.Models.Settings;
using iterimApi.Services.Interfaces;
using Microsoft.Extensions.Options;
using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;

namespace iterimApi.Services.Implementations;

public class EmailService : IEmailService
{
    private readonly EmailSettings _settings;
    private readonly ILogger<EmailService> _logger;
    private readonly IHttpClientFactory _httpClientFactory;

    public EmailService(
        IOptions<EmailSettings> settings,
        ILogger<EmailService> logger,
        IHttpClientFactory httpClientFactory)
    {
        _settings = settings.Value;
        _logger = logger;
        _httpClientFactory = httpClientFactory;
    }

    public async Task SendEmailConfirmationAsync(string toEmail, string toName, string confirmationToken, string? language = null)
    {
        var url = $"{_settings.FrontendBaseUrl}/confirm-email?token={Uri.EscapeDataString(confirmationToken)}";
        var subject = EmailTemplates.EmailConfirmationSubject(language);
        var body = EmailTemplates.EmailConfirmation(toName, url, language);
        await SendAsync(toEmail, toName, subject, body);
    }

    public async Task SendEmailChangeConfirmationAsync(string toEmail, string toName, string confirmationToken, string? language = null)
    {
        var url = $"{_settings.FrontendBaseUrl}/confirm-email?token={Uri.EscapeDataString(confirmationToken)}";
        var subject = EmailTemplates.EmailChangeConfirmationSubject(language);
        var body = EmailTemplates.EmailChangeConfirmation(toName, url, language);
        await SendAsync(toEmail, toName, subject, body);
    }

    public async Task SendPasswordResetAsync(string toEmail, string toName, string resetToken, string? language = null)
    {
        var url = $"{_settings.FrontendBaseUrl}/reset-password?token={Uri.EscapeDataString(resetToken)}";
        var subject = EmailTemplates.PasswordResetSubject(language);
        var body = EmailTemplates.PasswordReset(toName, url, language);
        await SendAsync(toEmail, toName, subject, body);
    }

    // ── Internal dispatch ────────────────────────────────────

    private Task SendAsync(string toEmail, string toName, string subject, string htmlBody) =>
        _settings.Provider.ToLowerInvariant() switch
        {
            "resend"   => SendViaResendAsync(toEmail, toName, subject, htmlBody),
            "sendgrid" => SendViaSendGridAsync(toEmail, toName, subject, htmlBody),
            _          => SendViaSmtpAsync(toEmail, toName, subject, htmlBody)
        };

    // ── SMTP (Gmail App Password, Mailpit dev, etc.) ──────────
    private async Task SendViaSmtpAsync(string toEmail, string toName, string subject, string htmlBody)
    {
        var smtp = _settings.Smtp
            ?? throw new InvalidOperationException("SMTP settings are not configured.");

        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(_settings.FromName, _settings.FromAddress));
        message.To.Add(new MailboxAddress(toName, toEmail));
        message.Subject = subject;
        message.Body = new TextPart("html") { Text = htmlBody };

        using var client = new SmtpClient();
        await client.ConnectAsync(smtp.Host, smtp.Port, SecureSocketOptions.StartTls);
        await client.AuthenticateAsync(smtp.Username, smtp.Password);
        await client.SendAsync(message);
        await client.DisconnectAsync(true);

        _logger.LogInformation("Email sent via SMTP to {Email}", toEmail);
    }

    // ── Resend (https://resend.com) ───────────────────────────
    private async Task SendViaResendAsync(string toEmail, string toName, string subject, string htmlBody)
    {
        var apiKey = _settings.ResendApiKey
            ?? throw new InvalidOperationException("Resend API key is not configured.");

        var client = _httpClientFactory.CreateClient("resend");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);

        var payload = new
        {
            from = $"{_settings.FromName} <{_settings.FromAddress}>",
            to = new[] { $"{toName} <{toEmail}>" },
            subject,
            html = htmlBody
        };

        var response = await client.PostAsync(
            "https://api.resend.com/emails",
            new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json"));

        if (!response.IsSuccessStatusCode)
        {
            var error = await response.Content.ReadAsStringAsync();
            _logger.LogError("Resend API error: {Error}", error);
            throw new InvalidOperationException($"Resend API error: {response.StatusCode}");
        }

        _logger.LogInformation("Email sent via Resend to {Email}", toEmail);
    }

    // ── SendGrid ──────────────────────────────────────────────
    private async Task SendViaSendGridAsync(string toEmail, string toName, string subject, string htmlBody)
    {
        var apiKey = _settings.SendGridApiKey
            ?? throw new InvalidOperationException("SendGrid API key is not configured.");

        var client = _httpClientFactory.CreateClient("sendgrid");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);

        var payload = new
        {
            personalizations = new[]
            {
                new { to = new[] { new { email = toEmail, name = toName } } }
            },
            from = new { email = _settings.FromAddress, name = _settings.FromName },
            subject,
            content = new[] { new { type = "text/html", value = htmlBody } }
        };

        var response = await client.PostAsync(
            "https://api.sendgrid.com/v3/mail/send",
            new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json"));

        if (!response.IsSuccessStatusCode)
        {
            var error = await response.Content.ReadAsStringAsync();
            _logger.LogError("SendGrid API error: {Error}", error);
            throw new InvalidOperationException($"SendGrid API error: {response.StatusCode}");
        }

        _logger.LogInformation("Email sent via SendGrid to {Email}", toEmail);
    }
}
