namespace iterimApi.DTOs.Feedback;

public class CreateFeedbackDto
{
    public string Language { get; set; } = "en";
    public int SprintsUsed { get; set; }
    public int OverallRating { get; set; }
    public bool WasSatisfied { get; set; }

    /// <summary>List of FeedbackDissatisfactionReason enum names (e.g. ["MissingFunctionality","TooExpensive"]).</summary>
    public List<string> DissatisfactionReasons { get; set; } = [];

    public string? MissedFunctionalities { get; set; }
    public string? HardestToFind { get; set; }
    public int? DaysToGetUsedTo { get; set; }
    public string? MissedIntegrations { get; set; }
    public decimal? AcceptableMonthlyPricePerUser { get; set; }
    public string? OtherReasonDescription { get; set; }
    public string? UnmentionedFlawDescription { get; set; }
    public string? MostUsefulFeature { get; set; }
    public bool EncounteredBugs { get; set; }
    public string? BugContext { get; set; }
    public bool WouldTryAgain { get; set; }
}

public class FeedbackDto
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string UserEmail { get; set; } = string.Empty;
    public string Language { get; set; } = "en";
    public int SprintsUsed { get; set; }
    public int OverallRating { get; set; }
    public bool WasSatisfied { get; set; }
    public List<string> DissatisfactionReasons { get; set; } = [];
    public string? MissedFunctionalities { get; set; }
    public string? HardestToFind { get; set; }
    public int? DaysToGetUsedTo { get; set; }
    public string? MissedIntegrations { get; set; }
    public decimal? AcceptableMonthlyPricePerUser { get; set; }
    public string? OtherReasonDescription { get; set; }
    public string? UnmentionedFlawDescription { get; set; }
    public string? MostUsefulFeature { get; set; }
    public bool EncounteredBugs { get; set; }
    public string? BugContext { get; set; }
    public bool WouldTryAgain { get; set; }
    public bool IsReviewed { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? ReviewedByUserName { get; set; }
    public DateTime? ReviewedAt { get; set; }
}

public class FeedbackListResponseDto
{
    public List<FeedbackDto> Items { get; set; } = [];
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
}

public class FeedbackSummaryDto
{
    public int TotalCount { get; set; }
    public int ReviewedCount { get; set; }
    public int UnreviewedCount { get; set; }
    public double AverageRating { get; set; }
    public double AverageSprintsUsed { get; set; }
    public int SatisfiedCount { get; set; }
    public int UnsatisfiedCount { get; set; }
    public int EncounteredBugsCount { get; set; }
    public int WouldTryAgainCount { get; set; }
    public Dictionary<string, int> DissatisfactionReasonCounts { get; set; } = new();
    public Dictionary<int, int> RatingDistribution { get; set; } = new();
}