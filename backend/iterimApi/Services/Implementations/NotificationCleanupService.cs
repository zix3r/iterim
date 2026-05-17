using iterimApi.Services.Interfaces;

namespace iterimApi.Services.Implementations;

/// <summary>
/// Periodiškai (kas 24h) ištrina pranešimus, kurie senesni nei 30 dienų.
/// Optional acceptance criterion from the notification system task.
/// </summary>
public class NotificationCleanupService : BackgroundService
{
    private readonly IServiceProvider _services;
    private readonly ILogger<NotificationCleanupService> _logger;
    private static readonly TimeSpan Interval = TimeSpan.FromHours(24);
    private const int RetentionDays = 30;

    public NotificationCleanupService(
        IServiceProvider services,
        ILogger<NotificationCleanupService> logger)
    {
        _services = services;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // Wait a short delay on startup so the DB migration finishes first.
        try
        {
            await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
        }
        catch (TaskCanceledException) { return; }

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _services.CreateScope();
                var notificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();

                var deleted = await notificationService.DeleteOlderThanAsync(RetentionDays);
                if (deleted > 0)
                {
                    _logger.LogInformation(
                        "Notification cleanup: deleted {Count} notifications older than {Days} days",
                        deleted, RetentionDays);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Notification cleanup failed");
            }

            try
            {
                await Task.Delay(Interval, stoppingToken);
            }
            catch (TaskCanceledException) { return; }
        }
    }
}
