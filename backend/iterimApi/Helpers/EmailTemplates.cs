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
      <span>Projektu valdymo sistema</span>
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

    private const string PasswordResetHtml = @"<!DOCTYPE html>
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
      <span>Projektu valdymo sistema</span>
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
}