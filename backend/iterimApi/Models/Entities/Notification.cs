using iterimApi.Models.Enums;

namespace iterimApi.Models.Entities;

public class Notification
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public NotificationType Type { get; set; }

    /// <summary>
    /// Translation key for the title (e.g. "notifications.workItemAssigned.title").
    /// Frontend looks this up in translations.ts.
    /// </summary>
    public string TitleKey { get; set; } = string.Empty;

    /// <summary>
    /// Translation key for the message body.
    /// </summary>
    public string MessageKey { get; set; } = string.Empty;

    /// <summary>
    /// JSON-serialized dictionary of placeholder values for the title/message templates.
    /// Example: {"workItemTitle":"Fix login bug","blockerTitle":"Set up CI"}
    /// Null when the message has no placeholders.
    /// </summary>
    public string? MessageParams { get; set; }

    /// <summary>
    /// Pre-rendered English fallback title — shown if the frontend doesn't have a
    /// translation for TitleKey. Always populated server-side.
    /// </summary>
    public string Title { get; set; } = string.Empty;

    /// <summary>
    /// Pre-rendered English fallback message body.
    /// </summary>
    public string Message { get; set; } = string.Empty;

    public bool IsRead { get; set; } = false;
    public string? RelatedUrl { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public User User { get; set; } = null!;
}