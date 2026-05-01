namespace iterimApi.Helpers;

public static class EmailTemplates
{
    // Palaikomos kalbos: "lt", "en". Default — "lt".
    private static string Normalize(string? language)
    {
        if (string.IsNullOrWhiteSpace(language)) return "lt";
        var lower = language.Trim().ToLowerInvariant();
        // pvz., "en-US" → "en"
        var dash = lower.IndexOf('-');
        if (dash > 0) lower = lower[..dash];
        return lower switch
        {
            "en" => "en",
            _    => "lt"
        };
    }

    public static string EmailConfirmation(string recipientName, string confirmationUrl, string? language = null)
    {
        var lang = Normalize(language);
        var template = lang == "en" ? EmailConfirmationHtmlEn : EmailConfirmationHtmlLt;
        return template
            .Replace("{{RECIPIENT_NAME}}", recipientName)
            .Replace("{{CONFIRMATION_URL}}", confirmationUrl)
            .Replace("{{YEAR}}", DateTime.UtcNow.Year.ToString());
    }

    public static string PasswordReset(string recipientName, string resetUrl, string? language = null)
    {
        var lang = Normalize(language);
        var template = lang == "en" ? PasswordResetHtmlEn : PasswordResetHtmlLt;
        return template
            .Replace("{{RECIPIENT_NAME}}", recipientName)
            .Replace("{{RESET_URL}}", resetUrl)
            .Replace("{{YEAR}}", DateTime.UtcNow.Year.ToString());
    }

    public static string EmailChangeConfirmation(string recipientName, string confirmationUrl, string? language = null)
    {
        var lang = Normalize(language);
        var template = lang == "en" ? EmailChangeConfirmationHtmlEn : EmailChangeConfirmationHtmlLt;
        return template
            .Replace("{{RECIPIENT_NAME}}", recipientName)
            .Replace("{{CONFIRMATION_URL}}", confirmationUrl)
            .Replace("{{YEAR}}", DateTime.UtcNow.Year.ToString());
    }

    public static string OrganizationInvitation(
        string recipientName,
        string organizationName,
        string inviterName,
        string role,
        string invitationUrl,
        string? language = null)
    {
        var lang = Normalize(language);
        var template = lang == "en" ? OrganizationInvitationHtmlEn : OrganizationInvitationHtmlLt;
        return template
            .Replace("{{RECIPIENT_NAME}}", recipientName)
            .Replace("{{ORGANIZATION_NAME}}", organizationName)
            .Replace("{{INVITER_NAME}}", inviterName)
            .Replace("{{ROLE}}", role)
            .Replace("{{INVITATION_URL}}", invitationUrl)
            .Replace("{{YEAR}}", DateTime.UtcNow.Year.ToString());
    }

    // Subjects — patogu kviesti iš EmailService

    public static string EmailConfirmationSubject(string? language = null) =>
        Normalize(language) == "en"
            ? "Confirm your email – Iterim"
            : "Patvirtinkite savo el. paštą – Iterim";

    public static string EmailChangeConfirmationSubject(string? language = null) =>
        Normalize(language) == "en"
            ? "Confirm your new email address – Iterim"
            : "Patvirtinkite naują el. pašto adresą – Iterim";

    public static string PasswordResetSubject(string? language = null) =>
        Normalize(language) == "en"
            ? "Password reset – Iterim"
            : "Slaptažodžio atkūrimas – Iterim";

    public static string OrganizationInvitationSubject(string organizationName, string? language = null) =>
        Normalize(language) == "en"
            ? $"You've been invited to join {organizationName} – Iterim"
            : $"Jus pakvietė prisijungti prie organizacijos „{organizationName}“ – Iterim";

    // ─────────────────────────── LT ───────────────────────────

    private const string EmailConfirmationHtmlLt = @"<!DOCTYPE html>
<html lang='lt'>
<head>
  <meta charset='UTF-8' />
  <meta name='viewport' content='width=device-width, initial-scale=1.0' />
  <title>Patvirtinkite el. pastą</title>
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
      <span>Projektų valdymo sistema</span>
    </div>
    <div class='body'>
      <p>Sveiki, <strong>{{RECIPIENT_NAME}}</strong>!</p>
      <p>Ačiū, kad užsiregistravote. Norėdami aktyvuoti paskyrą, patvirtinkite savo el. pašto adresą:</p>
      <a href='{{CONFIRMATION_URL}}' class='btn'>Patvirtinti el. paštą</a>
      <div class='note'>
        <p>Jei mygtuko nepavyksta paspausti, kopijuokite šią nuorodą į naršyklę:<br/>
        <a href='{{CONFIRMATION_URL}}'>{{CONFIRMATION_URL}}</a></p>
        <p>Nuoroda galioja <strong>24 valandas</strong>. Jei neprašėte registracijos - ignoruokite šį laišką.</p>
      </div>
    </div>
    <div class='footer'>© {{YEAR}} Iterim. Visos teisė saugomos.</div>
  </div>
</body>
</html>";

    private const string EmailChangeConfirmationHtmlLt = @"<!DOCTYPE html>
<html lang='lt'>
<head>
  <meta charset='UTF-8' />
  <meta name='viewport' content='width=device-width, initial-scale=1.0' />
  <title>Patvirtinkite naują el. paštą</title>
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
    .warning { background: #fef2f2; border-left: 3px solid #dc2626; padding: 12px 16px; border-radius: 4px; font-size: 13px; color: #7f1d1d; margin-bottom: 20px; }
    .footer { background: #f4f4f5; padding: 18px 40px; text-align: center; font-size: 12px; color: #a1a1aa; }
  </style>
</head>
<body>
  <div class='wrapper'>
    <div class='header'>
      <h1>iterim</h1>
      <span>Projektų valdymo sistema</span>
    </div>
    <div class='body'>
      <p>Sveiki, <strong>{{RECIPIENT_NAME}}</strong>!</p>
      <p>Gavome prašymą pakeisti jūsų paskyros el. pašto adresą į šį adresą.</p>
      <p>Norėdami patvirtinti pakeitimą, paspauskite mygtuką:</p>
      <a href='{{CONFIRMATION_URL}}' class='btn'>Patvirtinti naują el. paštą</a>
      <div class='warning'>
        Jei neprašėte keisti el. pašto adreso, tiesiog ignoruokite šį laišką.
      </div>
      <div class='note'>
        <p>Jei mygtuko nepavyksta paspausti, kopijuokite šią nuorodą į naršyklę:<br/>
        <a href='{{CONFIRMATION_URL}}'>{{CONFIRMATION_URL}}</a></p>
        <p>Nuoroda galioja <strong>10 min</strong>.</p>
      </div>
    </div>
    <div class='footer'>© {{YEAR}} Iterim. Visos teisė saugomos.</div>
  </div>
</body>
</html>";

    private const string PasswordResetHtmlLt = @"<!DOCTYPE html>
<html lang='lt'>
<head>
  <meta charset='UTF-8' />
  <meta name='viewport' content='width=device-width, initial-scale=1.0' />
  <title>Slaptazodzio atkurimas</title>
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
      <span>Projektų valdymo sistema</span>
    </div>
    <div class='body'>
      <p>Sveiki, <strong>{{RECIPIENT_NAME}}</strong>!</p>
      <p>Gavome prašymą atkurti jūsų paskyros slaptažodį. Paspauskite žemiau esantį mygtuką:</p>
      <a href='{{RESET_URL}}' class='btn'>Atkurti slaptažodį</a>
      <div class='warning'>
        Nuoroda galioja tik <strong>1 valandą</strong> ir gali būti panaudota tik vieną kartą.
      </div>
      <div class='note'>
        <p>Jei mygtuko nepavyksta paspausti, kopijuokite šią nuorodą į naršyklę:<br/>
        <a href='{{RESET_URL}}'>{{RESET_URL}}</a></p>
        <p>Jei neprašėte slaptaždžio atkūrimo - ignoruokite šį laišką.</p>
      </div>
    </div>
    <div class='footer'>© {{YEAR}} Iterim. Visos teisės saugomos.</div>
  </div>
</body>
</html>";

    // ─────────────────────────── EN ───────────────────────────

    private const string EmailConfirmationHtmlEn = @"<!DOCTYPE html>
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
      <span>Project management system</span>
    </div>
    <div class='body'>
      <p>Hi, <strong>{{RECIPIENT_NAME}}</strong>!</p>
      <p>Thanks for signing up. To activate your account, please confirm your email address:</p>
      <a href='{{CONFIRMATION_URL}}' class='btn'>Confirm email</a>
      <div class='note'>
        <p>If the button doesn't work, copy this link into your browser:<br/>
        <a href='{{CONFIRMATION_URL}}'>{{CONFIRMATION_URL}}</a></p>
        <p>This link is valid for <strong>24 hours</strong>. If you didn't sign up, please ignore this email.</p>
      </div>
    </div>
    <div class='footer'>© {{YEAR}} Iterim. All rights reserved.</div>
  </div>
</body>
</html>";

    private const string EmailChangeConfirmationHtmlEn = @"<!DOCTYPE html>
<html lang='en'>
<head>
  <meta charset='UTF-8' />
  <meta name='viewport' content='width=device-width, initial-scale=1.0' />
  <title>Confirm your new email</title>
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
    .warning { background: #fef2f2; border-left: 3px solid #dc2626; padding: 12px 16px; border-radius: 4px; font-size: 13px; color: #7f1d1d; margin-bottom: 20px; }
    .footer { background: #f4f4f5; padding: 18px 40px; text-align: center; font-size: 12px; color: #a1a1aa; }
  </style>
</head>
<body>
  <div class='wrapper'>
    <div class='header'>
      <h1>iterim</h1>
      <span>Project management system</span>
    </div>
    <div class='body'>
      <p>Hi, <strong>{{RECIPIENT_NAME}}</strong>!</p>
      <p>We received a request to change your account's email address to this address.</p>
      <p>To confirm the change, click the button below:</p>
      <a href='{{CONFIRMATION_URL}}' class='btn'>Confirm new email</a>
      <div class='warning'>
        If you didn't request this change, simply ignore this email.
      </div>
      <div class='note'>
        <p>If the button doesn't work, copy this link into your browser:<br/>
        <a href='{{CONFIRMATION_URL}}'>{{CONFIRMATION_URL}}</a></p>
        <p>This link is valid for <strong>10 minutes</strong>.</p>
      </div>
    </div>
    <div class='footer'>© {{YEAR}} Iterim. All rights reserved.</div>
  </div>
</body>
</html>";

    private const string PasswordResetHtmlEn = @"<!DOCTYPE html>
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
      <span>Project management system</span>
    </div>
    <div class='body'>
      <p>Hi, <strong>{{RECIPIENT_NAME}}</strong>!</p>
      <p>We received a request to reset your account password. Click the button below:</p>
      <a href='{{RESET_URL}}' class='btn'>Reset password</a>
      <div class='warning'>
        This link is valid for only <strong>1 hour</strong> and can be used only once.
      </div>
      <div class='note'>
        <p>If the button doesn't work, copy this link into your browser:<br/>
        <a href='{{RESET_URL}}'>{{RESET_URL}}</a></p>
        <p>If you didn't request a password reset, please ignore this email.</p>
      </div>
    </div>
    <div class='footer'>© {{YEAR}} Iterim. All rights reserved.</div>
  </div>
</body>
</html>";

    // ───────────── Organization invitation (LT) ─────────────

    private const string OrganizationInvitationHtmlLt = @"<!DOCTYPE html>
<html lang='lt'>
<head>
  <meta charset='UTF-8' />
  <meta name='viewport' content='width=device-width, initial-scale=1.0' />
  <title>Pakvietimas prisijungti prie organizacijos</title>
  <style>
    body { margin: 0; padding: 0; background: #f4f4f5; font-family: 'Segoe UI', Arial, sans-serif; }
    .wrapper { max-width: 560px; margin: 40px auto; background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,.08); }
    .header { background: #18181b; padding: 32px 40px; }
    .header h1 { margin: 0; color: #ffffff; font-size: 22px; letter-spacing: -0.5px; }
    .header span { color: #a1a1aa; font-size: 13px; }
    .body { padding: 36px 40px; color: #27272a; }
    .body p { line-height: 1.65; margin: 0 0 16px; font-size: 15px; }
    .info { background: #f4f4f5; border-radius: 6px; padding: 14px 18px; margin: 8px 0 22px; font-size: 14px; color: #3f3f46; }
    .info div { margin: 4px 0; }
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
      <span>Projektų valdymo sistema</span>
    </div>
    <div class='body'>
      <p>Sveiki, <strong>{{RECIPIENT_NAME}}</strong>!</p>
      <p><strong>{{INVITER_NAME}}</strong> kviečia jus prisijungti prie organizacijos <strong>„{{ORGANIZATION_NAME}}“</strong> sistemoje Iterim.</p>
      <div class='info'>
        <div><strong>Organizacija:</strong> {{ORGANIZATION_NAME}}</div>
        <div><strong>Rolė:</strong> {{ROLE}}</div>
        <div><strong>Pakvietė:</strong> {{INVITER_NAME}}</div>
      </div>
      <p>Prisijunkite prie Iterim ir priimkite arba atmeskite pakvietimą:</p>
      <a href='{{INVITATION_URL}}' class='btn'>Peržiūrėti pakvietimą</a>
      <div class='note'>
        <p>Jei mygtuko nepavyksta paspausti, kopijuokite šią nuorodą į naršyklę:<br/>
        <a href='{{INVITATION_URL}}'>{{INVITATION_URL}}</a></p>
        <p>Jei nesitikėjote šio pakvietimo, galite jį tiesiog ignoruoti arba atmesti prisijungę prie sistemos.</p>
      </div>
    </div>
    <div class='footer'>© {{YEAR}} Iterim. Visos teisės saugomos.</div>
  </div>
</body>
</html>";

    // ───────────── Organization invitation (EN) ─────────────

    private const string OrganizationInvitationHtmlEn = @"<!DOCTYPE html>
<html lang='en'>
<head>
  <meta charset='UTF-8' />
  <meta name='viewport' content='width=device-width, initial-scale=1.0' />
  <title>Organization invitation</title>
  <style>
    body { margin: 0; padding: 0; background: #f4f4f5; font-family: 'Segoe UI', Arial, sans-serif; }
    .wrapper { max-width: 560px; margin: 40px auto; background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,.08); }
    .header { background: #18181b; padding: 32px 40px; }
    .header h1 { margin: 0; color: #ffffff; font-size: 22px; letter-spacing: -0.5px; }
    .header span { color: #a1a1aa; font-size: 13px; }
    .body { padding: 36px 40px; color: #27272a; }
    .body p { line-height: 1.65; margin: 0 0 16px; font-size: 15px; }
    .info { background: #f4f4f5; border-radius: 6px; padding: 14px 18px; margin: 8px 0 22px; font-size: 14px; color: #3f3f46; }
    .info div { margin: 4px 0; }
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
      <span>Project management system</span>
    </div>
    <div class='body'>
      <p>Hi, <strong>{{RECIPIENT_NAME}}</strong>!</p>
      <p><strong>{{INVITER_NAME}}</strong> has invited you to join the <strong>{{ORGANIZATION_NAME}}</strong> organization on Iterim.</p>
      <div class='info'>
        <div><strong>Organization:</strong> {{ORGANIZATION_NAME}}</div>
        <div><strong>Role:</strong> {{ROLE}}</div>
        <div><strong>Invited by:</strong> {{INVITER_NAME}}</div>
      </div>
      <p>Sign in to Iterim to accept or decline the invitation:</p>
      <a href='{{INVITATION_URL}}' class='btn'>View invitation</a>
      <div class='note'>
        <p>If the button doesn't work, copy this link into your browser:<br/>
        <a href='{{INVITATION_URL}}'>{{INVITATION_URL}}</a></p>
        <p>If you weren't expecting this invitation, you can safely ignore it or decline once signed in.</p>
      </div>
    </div>
    <div class='footer'>© {{YEAR}} Iterim. All rights reserved.</div>
  </div>
</body>
</html>";
}
