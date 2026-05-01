namespace iterimApi.Services.Interfaces;

public interface IEmailService
{
    Task SendEmailConfirmationAsync(string toEmail, string toName, string confirmationToken, string? language = null);
    Task SendEmailChangeConfirmationAsync(string toEmail, string toName, string confirmationToken, string? language = null);
    Task SendPasswordResetAsync(string toEmail, string toName, string resetToken, string? language = null);
    Task SendOrganizationInvitationAsync(string toEmail, string toName, string organizationName, string inviterName, string role, string? language = null);
}
