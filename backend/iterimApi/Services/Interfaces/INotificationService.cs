using iterimApi.DTOs.Notifications;
using iterimApi.Models.Enums;

namespace iterimApi.Services.Interfaces;

public interface INotificationService
{
    /// <summary>
    /// Creates a notification using a translation key + parameter dictionary so the
    /// frontend can render it in any language. The English fallback strings are
    /// derived automatically from the key + params.
    /// Side-effect call — never throws. Errors are logged.
    /// </summary>
    Task CreateAsync(
        int userId,
        NotificationType type,
        string titleKey,
        string messageKey,
        Dictionary<string, string>? messageParams = null,
        string? relatedUrl = null);

    /// <summary>
    /// Same as CreateAsync but for multiple users. Deduplicates the userIds list.
    /// </summary>
    Task CreateForManyAsync(
        IEnumerable<int> userIds,
        NotificationType type,
        string titleKey,
        string messageKey,
        Dictionary<string, string>? messageParams = null,
        string? relatedUrl = null);

    Task<NotificationListResponseDto> GetAsync(int userId, int page, int pageSize);
    Task<int> GetUnreadCountAsync(int userId);
    Task<bool> MarkAsReadAsync(int notificationId, int userId);
    Task MarkAllAsReadAsync(int userId);
    Task<int> DeleteOlderThanAsync(int days);
}