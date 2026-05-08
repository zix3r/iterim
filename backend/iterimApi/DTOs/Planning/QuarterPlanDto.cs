namespace iterimApi.DTOs.Planning;

public class QuarterPlanDto
{
    public List<IterationSummaryDto> Iterations { get; set; } = new();
    public List<FeatureSpanDto> FeatureSummaries { get; set; } = new();
    public List<IterationCapacityDto> CapacityPerIteration { get; set; } = new();
}

public class IterationSummaryDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public string Status { get; set; } = string.Empty;
    public int TotalSP { get; set; }
    public int DoneSP { get; set; }
    public int InProgressSP { get; set; }
    public int TodoSP { get; set; }
    public List<QuarterWorkItemDto> WorkItems { get; set; } = new(); 
}

public class QuarterWorkItemDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public int? Points { get; set; }
}

public class FeatureSpanDto
{
    public int WorkItemId { get; set; }
    public string WorkItemTitle { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public int StartIterationId { get; set; }
    public int EndIterationId { get; set; }
    public int TotalSP { get; set; }
    public int CompletionPercent { get; set; }
}

public class IterationCapacityDto
{
    public int IterationId { get; set; }
    public int TotalWorkDays { get; set; }
    public int TotalAbsenceDays { get; set; }
    public int NetCapacityDays { get; set; }
}