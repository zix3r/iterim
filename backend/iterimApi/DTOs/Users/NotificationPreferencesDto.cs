namespace iterimApi.DTOs.Users;

public class NotificationPreferencesDto
{
    public bool NotificationsEnabled { get; set; }
    public bool NotifyOnWorkItemAssigned { get; set; }
    public bool NotifyOnBlockerResolved { get; set; }
    public bool NotifyOnAddedToTeam { get; set; }
    public bool NotifyOnAddedToOrganization { get; set; }
}