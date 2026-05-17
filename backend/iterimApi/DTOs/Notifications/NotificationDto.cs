using System.Text.Json;

namespace iterimApi.DTOs.Notifications;

public class NotificationDto
{
    public int Id { get; set; }
    public string Type { get; set; } = string.Empty;

    /// <summary>Translation key for the title — looked up via translations.ts.</summary>
    public string TitleKey { get; set; } = string.Empty;

    /// <summary>Translation key for the message body.</summary>
    public string MessageKey { get; set; } = string.Empty;

    /// <summary>Placeholder values for the title/message templates. Null when empty.</summary>
    public Dictionary<string, string>? MessageParams { get; set; }

    /// <summary>English fallback title.</summary>
    public string Title { get; set; } = string.Empty;

    /// <summary>English fallback message body.</summary>
    public string Message { get; set; } = string.Empty;

    public bool IsRead { get; set; }
    public string? RelatedUrl { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class NotificationListResponseDto
{
    public List<NotificationDto> Items { get; set; } = [];
    public int TotalCount { get; set; }
    public int UnreadCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
}

public class UnreadCountDto
{
    public int Count { get; set; }
}