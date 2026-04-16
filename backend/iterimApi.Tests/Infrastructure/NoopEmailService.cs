using iterimApi.Services.Interfaces;

namespace iterimApi.Tests.Infrastructure;

public sealed class NoopEmailService : IEmailService
{
    public Task SendEmailConfirmationAsync(string toEmail, string toName, string confirmationToken)
    {
        return Task.CompletedTask;
    }

    public Task SendPasswordResetAsync(string toEmail, string toName, string resetToken)
    {
        return Task.CompletedTask;
    }
}
