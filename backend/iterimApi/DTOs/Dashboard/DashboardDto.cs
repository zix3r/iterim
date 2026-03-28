namespace iterimApi.DTOs.Dashboard;

public class DashboardDto
{
    public List<DashboardOrganizationDto> Organizations { get; set; } = [];
    public List<DashboardWorkItemDto> MyWork { get; set; } = [];
    public List<DashboardActivityDto> RecentActivity { get; set; } = [];
}

public class DashboardOrganizationDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public int MemberCount { get; set; }
    public List<DashboardProductDto> Products { get; set; } = [];
}

public class DashboardProductDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public List<DashboardTeamDto> Teams { get; set; } = [];
}

public class DashboardTeamDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public DashboardSprintDto? ActiveSprint { get; set; }
}

public class DashboardSprintDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string EndDate { get; set; } = string.Empty; // Format as string for frontend? Or DateTime/DateOnly? Let's stick to string for "3 days left" calc on backend or frontend. Let's send Date and calc on frontend.
    public int DaysLeft { get; set; }
    public double Progress { get; set; } // Percentage or points?
    public int TotalPoints { get; set; }
    public int CompletedPoints { get; set; }
}

public class DashboardWorkItemDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public int Type { get; set; }
    public string TypeName { get; set; } = string.Empty;
    public int Status { get; set; } 
    public string StatusName { get; set; } = string.Empty;
    public int Priority { get; set; }
    public string PriorityName { get; set; } = string.Empty;
    public int? Points { get; set; }
    public int OrganizationId { get; set; }
    public string OrganizationName { get; set; } = string.Empty;
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public int TeamId { get; set; }
    public string TeamName { get; set; } = string.Empty;
}

public class DashboardActivityDto
{
    public int Id { get; set; }
    public string WorkItemTitle { get; set; } = string.Empty;
    public string WorkItemType { get; set; } = string.Empty;
    public int WorkItemId { get; set; }
    public string Description { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
    public string ActorName { get; set; } = string.Empty;
    public string Type { get; set; } = "Create"; // Create, Update, Comment
    public int OrganizationId { get; set; }
    public int ProductId { get; set; }
    public int TeamId { get; set; }
}
