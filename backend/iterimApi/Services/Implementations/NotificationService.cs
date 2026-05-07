using System.Text.Json;
using iterimApi.Data;
using iterimApi.DTOs.Notifications;
using iterimApi.Models.Entities;
using iterimApi.Models.Enums;
using iterimApi.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace iterimApi.Services.Implementations;

public class NotificationService : INotificationService
{
    private readonly AppDbContext _db;
    private readonly ILogger<NotificationService> _logger;

    /// <summary>
    /// English fallback templates per translation key. Used to render the Title/Message
    /// columns at create time so the frontend always has something to show even if a
    /// translation hasn't shipped yet.
    /// </summary>
    private static readonly Dictionary<string, string> EnglishFallbacks = new()
    {
        // Titles
        ["notifications.workItemAssigned.title"]    = "Work item assigned",
        ["notifications.blockerResolved.title"]     = "Work item unblocked",
        ["notifications.addedToTeam.title"]         = "Added to team",
        ["notifications.addedToOrganization.title"] = "Invited to organization",
        ["notifications.passwordReset.title"]       = "Password reset",

        // Messages — placeholders use {name} syntax
        ["notifications.workItemAssigned.message"]    = "You've been assigned to work item: \"{workItemTitle}\".",
        ["notifications.blockerResolved.message"]     = "Work item \"{workItemTitle}\" has been unblocked — the blocking work item \"{blockerTitle}\" was completed.",
        ["notifications.addedToTeam.message"]         = "You've been added to the team \"{teamName}\".",
        ["notifications.addedToOrganization.message"] = "You've been invited to the organization \"{organizationName}\".",
        ["notifications.passwordReset.message"]       = "An administrator has initiated a password reset for your account. Check your email for the reset link."
    };

    public NotificationService(AppDbContext db, ILogger<NotificationService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task CreateAsync(
        int userId,
        NotificationType type,
        string titleKey,
        string messageKey,
        Dictionary<string, string>? messageParams = null,
        string? relatedUrl = null)
    {
        try
        {
            // PasswordReset bypasses preferences — always delivered for security reasons.
            if (type != NotificationType.PasswordReset)
            {
                if (!await IsTypeAllowedAsync(userId, type))
                    return;
            }

            var notification = new Notification
            {
                UserId = userId,
                Type = type,
                TitleKey = titleKey,
                MessageKey = messageKey,
                MessageParams = messageParams != null && messageParams.Count > 0
                    ? JsonSerializer.Serialize(messageParams)
                    : null,
                Title = RenderEnglish(titleKey, messageParams),
                Message = RenderEnglish(messageKey, messageParams),
                RelatedUrl = relatedUrl,
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };

            _db.Notifications.Add(notification);
            await _db.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "Failed to create notification for user {UserId} (type={Type})",
                userId, type);
        }
    }

    public async Task CreateForManyAsync(
        IEnumerable<int> userIds,
        NotificationType type,
        string titleKey,
        string messageKey,
        Dictionary<string, string>? messageParams = null,
        string? relatedUrl = null)
    {
        var unique = userIds.Where(id => id > 0).Distinct().ToList();
        if (unique.Count == 0) return;

        // Delegate to CreateAsync per-user so preference gating runs once per recipient.
        foreach (var uid in unique)
        {
            await CreateAsync(uid, type, titleKey, messageKey, messageParams, relatedUrl);
        }
    }

    public async Task<NotificationListResponseDto> GetAsync(int userId, int page, int pageSize)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 20;
        if (pageSize > 100) pageSize = 100;

        var baseQuery = _db.Notifications
            .AsNoTracking()
            .Where(n => n.UserId == userId);

        var totalCount = await baseQuery.CountAsync();
        var unreadCount = await baseQuery.CountAsync(n => !n.IsRead);

        var rows = await baseQuery
            .OrderByDescending(n => n.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(n => new
            {
                n.Id,
                n.Type,
                n.TitleKey,
                n.MessageKey,
                n.MessageParams,
                n.Title,
                n.Message,
                n.IsRead,
                n.RelatedUrl,
                n.CreatedAt
            })
            .ToListAsync();

        var items = rows.Select(n => new NotificationDto
        {
            Id = n.Id,
            Type = n.Type.ToString(),
            TitleKey = n.TitleKey,
            MessageKey = n.MessageKey,
            MessageParams = DeserializeParams(n.MessageParams),
            Title = n.Title,
            Message = n.Message,
            IsRead = n.IsRead,
            RelatedUrl = n.RelatedUrl,
            CreatedAt = n.CreatedAt
        }).ToList();

        return new NotificationListResponseDto
        {
            Items = items,
            TotalCount = totalCount,
            UnreadCount = unreadCount,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<int> GetUnreadCountAsync(int userId)
    {
        return await _db.Notifications
            .AsNoTracking()
            .CountAsync(n => n.UserId == userId && !n.IsRead);
    }

    public async Task<bool> MarkAsReadAsync(int notificationId, int userId)
    {
        var notification = await _db.Notifications
            .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId);

        if (notification == null)
            return false;

        if (!notification.IsRead)
        {
            notification.IsRead = true;
            await _db.SaveChangesAsync();
        }

        return true;
    }

    public async Task MarkAllAsReadAsync(int userId)
    {
        await _db.Notifications
            .Where(n => n.UserId == userId && !n.IsRead)
            .ExecuteUpdateAsync(setters => setters.SetProperty(n => n.IsRead, true));
    }

    public async Task<int> DeleteOlderThanAsync(int days)
    {
        if (days < 1) days = 30;
        var cutoff = DateTime.UtcNow.AddDays(-days);

        return await _db.Notifications
            .Where(n => n.CreatedAt < cutoff)
            .ExecuteDeleteAsync();
    }

    private async Task<bool> IsTypeAllowedAsync(int userId, NotificationType type)
    {
        var prefs = await _db.Users
            .AsNoTracking()
            .Where(u => u.Id == userId)
            .Select(u => new
            {
                u.NotificationsEnabled,
                u.NotifyOnWorkItemAssigned,
                u.NotifyOnBlockerResolved,
                u.NotifyOnAddedToTeam,
                u.NotifyOnAddedToOrganization
            })
            .FirstOrDefaultAsync();

        if (prefs == null) return false;
        if (!prefs.NotificationsEnabled) return false;

        return type switch
        {
            NotificationType.WorkItemAssigned    => prefs.NotifyOnWorkItemAssigned,
            NotificationType.BlockerResolved     => prefs.NotifyOnBlockerResolved,
            NotificationType.AddedToTeam         => prefs.NotifyOnAddedToTeam,
            NotificationType.AddedToOrganization => prefs.NotifyOnAddedToOrganization,
            _ => true
        };
    }

    /// <summary>
    /// Renders the English fallback string for a given key, substituting {placeholder}
    /// tokens with values from the params dict. If the key is unknown, returns the key
    /// itself so something is always displayable.
    /// </summary>
    private static string RenderEnglish(string key, Dictionary<string, string>? parameters)
    {
        if (!EnglishFallbacks.TryGetValue(key, out var template))
            return key;

        if (parameters == null || parameters.Count == 0)
            return template;

        foreach (var (k, v) in parameters)
        {
            template = template.Replace("{" + k + "}", v);
        }
        return template;
    }

    private static Dictionary<string, string>? DeserializeParams(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return null;
        try
        {
            return JsonSerializer.Deserialize<Dictionary<string, string>>(json);
        }
        catch
        {
            return null;
        }
    }
}