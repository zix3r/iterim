namespace iterimApi.Services.Interfaces;

public interface IEmailService
{
    Task SendEmailConfirmationAsync(string toEmail, string toName, string confirmationToken);
    Task SendEmailChangeConfirmationAsync(string toEmail, string toName, string confirmationToken);
    Task SendPasswordResetAsync(string toEmail, string toName, string resetToken);
}
