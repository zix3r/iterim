namespace iterimApi.Helpers;

public static class EmailTemplates
{
    public static string EmailConfirmation(string recipientName, string confirmationUrl)
    {
        return EmailConfirmationHtml
            .Replace("{{RECIPIENT_NAME}}", recipientName)
            .Replace("{{CONFIRMATION_URL}}", confirmationUrl)
            .Replace("{{YEAR}}", DateTime.UtcNow.Year.ToString());
    }

    public static string PasswordReset(string recipientName, string resetUrl)
    {
        return PasswordResetHtml
            .Replace("{{RECIPIENT_NAME}}", recipientName)
            .Replace("{{RESET_URL}}", resetUrl)
            .Replace("{{YEAR}}", DateTime.UtcNow.Year.ToString());
    }

    private const string EmailConfirmationHtml = @"<!DOCTYPE html>
<html lang='en'>
<head>
  <meta charset='UTF-8' />
  <meta name='viewport' content='width=device-width, initial-scale=1.0' />
  <title>Confirm your email</title>
  <style>
    body { margin: 0; padding: 0; background: #f4f4f5; font-family: 'Segoe UI', Arial, sans-serif; }
    .wrapper { max-width: 560px; margin: 40px auto; background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,.08); }
    .header { background: #18181b; padding: 32px 40px; }
    .header h1 { margin: 0; color: #ffffff; font-size: 22px; letter-spacing: -0.5px; }
    .header span { color: #a1a1aa; font-size: 13px; }
    .body { padding: 36px 40px; color: #27272a; }
    .body p { line-height: 1.65; margin: 0 0 16px; font-size: 15px; }
    .btn { display: inline-block; margin: 8px 0 24px; padding: 13px 28px; background: #18181b; color: #ffffff !important; text-decoration: none; border-radius: 7px; font-size: 15px; font-weight: 600; }
    .note { font-size: 13px; color: #71717a; border-top: 1px solid #e4e4e7; padding-top: 20px; margin-top: 8px; }
    .note a { color: #71717a; word-break: break-all; }
    .footer { background: #f4f4f5; padding: 18px 40px; text-align: center; font-size: 12px; color: #a1a1aa; }
  </style>
</head>
<body>
  <div class='wrapper'>
    <div class='header'>
      <h1>iterim</h1>
      <span>Project management platform</span>
    </div>
    <div class='body'>
      <p>Hello, <strong>{{RECIPIENT_NAME}}</strong>!</p>
      <p>Thanks for signing up. To activate your account, please confirm your email address:</p>
      <a href='{{CONFIRMATION_URL}}' class='btn'>Confirm email</a>
      <div class='note'>
        <p>If the button does not work, copy this link into your browser:<br/>
        <a href='{{CONFIRMATION_URL}}'>{{CONFIRMATION_URL}}</a></p>
        <p>This link is valid for <strong>24 hours</strong>. If you did not request this, you can ignore this email.</p>
      </div>
    </div>
    <div class='footer'>© {{YEAR}} Iterim. All rights reserved.</div>
  </div>
</body>
</html>";

    private const string PasswordResetHtml = @"<!DOCTYPE html>
<html lang='en'>
<head>
  <meta charset='UTF-8' />
  <meta name='viewport' content='width=device-width, initial-scale=1.0' />
  <title>Password reset</title>
  <style>
    body { margin: 0; padding: 0; background: #f4f4f5; font-family: 'Segoe UI', Arial, sans-serif; }
    .wrapper { max-width: 560px; margin: 40px auto; background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,.08); }
    .header { background: #18181b; padding: 32px 40px; }
    .header h1 { margin: 0; color: #ffffff; font-size: 22px; letter-spacing: -0.5px; }
    .header span { color: #a1a1aa; font-size: 13px; }
    .body { padding: 36px 40px; color: #27272a; }
    .body p { line-height: 1.65; margin: 0 0 16px; font-size: 15px; }
    .btn { display: inline-block; margin: 8px 0 24px; padding: 13px 28px; background: #18181b; color: #ffffff !important; text-decoration: none; border-radius: 7px; font-size: 15px; font-weight: 600; }
    .warning { background: #fef9c3; border-left: 3px solid #ca8a04; padding: 12px 16px; border-radius: 4px; font-size: 13px; color: #713f12; margin-bottom: 20px; }
    .note { font-size: 13px; color: #71717a; border-top: 1px solid #e4e4e7; padding-top: 20px; margin-top: 8px; }
    .note a { color: #71717a; word-break: break-all; }
    .footer { background: #f4f4f5; padding: 18px 40px; text-align: center; font-size: 12px; color: #a1a1aa; }
  </style>
</head>
<body>
  <div class='wrapper'>
    <div class='header'>
      <h1>iterim</h1>
      <span>Project management platform</span>
    </div>
    <div class='body'>
      <p>Hello, <strong>{{RECIPIENT_NAME}}</strong>!</p>
      <p>We received a request to reset your account password. Click the button below:</p>
      <a href='{{RESET_URL}}' class='btn'>Reset password</a>
      <div class='warning'>
        This link is valid for <strong>1 hour</strong> and can be used only once.
      </div>
      <div class='note'>
        <p>If the button does not work:<br/>
        <a href='{{RESET_URL}}'>{{RESET_URL}}</a></p>
        <p>If you did not request a password reset, ignore this email. Your account remains secure.</p>
      </div>
    </div>
    <div class='footer'>© {{YEAR}} Iterim. All rights reserved.</div>
  </div>
</body>
</html>";
}
