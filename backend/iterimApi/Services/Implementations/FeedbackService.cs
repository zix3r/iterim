using iterimApi.Data;
using iterimApi.DTOs.Feedback;
using iterimApi.Models.Entities;
using iterimApi.Models.Enums;
using iterimApi.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace iterimApi.Services.Implementations;

public class FeedbackService : IFeedbackService
{
    private readonly AppDbContext _db;
    private readonly ILogger<FeedbackService> _logger;

    public FeedbackService(AppDbContext db, ILogger<FeedbackService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<FeedbackDto> CreateAsync(int userId, CreateFeedbackDto dto)
    {
        var reasons = ParseReasons(dto.DissatisfactionReasons);

        var feedback = new Feedback
        {
            UserId = userId,
            Language = (dto.Language ?? "en").ToLowerInvariant(),
            SprintsUsed = Math.Clamp(dto.SprintsUsed, 0, 1000),
            OverallRating = Math.Clamp(dto.OverallRating, 1, 5),
            WasSatisfied = dto.WasSatisfied,
            DissatisfactionReasons = dto.WasSatisfied ? FeedbackDissatisfactionReason.None : reasons,
            MissedFunctionalities = Truncate(dto.MissedFunctionalities, 2000),
            HardestToFind = Truncate(dto.HardestToFind, 2000),
            DaysToGetUsedTo = dto.DaysToGetUsedTo,
            MissedIntegrations = Truncate(dto.MissedIntegrations, 2000),
            AcceptableMonthlyPricePerUser = dto.AcceptableMonthlyPricePerUser,
            OtherReasonDescription = Truncate(dto.OtherReasonDescription, 2000),
            UnmentionedFlawDescription = Truncate(dto.UnmentionedFlawDescription, 2000),
            MostUsefulFeature = Truncate(dto.MostUsefulFeature, 2000),
            EncounteredBugs = dto.EncounteredBugs,
            BugContext = dto.EncounteredBugs ? Truncate(dto.BugContext, 2000) : null,
            WouldTryAgain = dto.WouldTryAgain,
            CreatedAt = DateTime.UtcNow,
        };

        _db.Feedbacks.Add(feedback);
        await _db.SaveChangesAsync();

        await _db.Entry(feedback).Reference(f => f.User).LoadAsync();
        return MapToDto(feedback);
    }

    public async Task<FeedbackListResponseDto> GetAllAsync(
        int page,
        int pageSize,
        bool? isReviewed = null,
        bool? wasSatisfied = null,
        bool? encounteredBugs = null,
        bool? wouldTryAgain = null)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 20;
        if (pageSize > 100) pageSize = 100;

        var query = _db.Feedbacks
            .AsNoTracking()
            .Include(f => f.User)
            .Include(f => f.ReviewedByUser)
            .AsQueryable();

        if (isReviewed.HasValue) query = query.Where(f => f.IsReviewed == isReviewed.Value);
        if (wasSatisfied.HasValue) query = query.Where(f => f.WasSatisfied == wasSatisfied.Value);
        if (encounteredBugs.HasValue) query = query.Where(f => f.EncounteredBugs == encounteredBugs.Value);
        if (wouldTryAgain.HasValue) query = query.Where(f => f.WouldTryAgain == wouldTryAgain.Value);

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderByDescending(f => f.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new FeedbackListResponseDto
        {
            Items = items.Select(MapToDto).ToList(),
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize,
        };
    }

    public async Task<FeedbackDto?> ToggleReviewedAsync(int feedbackId, int reviewerUserId)
    {
        var feedback = await _db.Feedbacks
            .Include(f => f.User)
            .Include(f => f.ReviewedByUser)
            .FirstOrDefaultAsync(f => f.Id == feedbackId);

        if (feedback == null) return null;

        if (feedback.IsReviewed)
        {
            feedback.IsReviewed = false;
            feedback.ReviewedBy = null;
            feedback.ReviewedAt = null;
        }
        else
        {
            feedback.IsReviewed = true;
            feedback.ReviewedBy = reviewerUserId;
            feedback.ReviewedAt = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync();
        await _db.Entry(feedback).Reference(f => f.ReviewedByUser).LoadAsync();
        return MapToDto(feedback);
    }

    public async Task<FeedbackSummaryDto> GetSummaryAsync()
    {
        var all = await _db.Feedbacks.AsNoTracking().ToListAsync();
        if (all.Count == 0)
        {
            return new FeedbackSummaryDto
            {
                RatingDistribution = new Dictionary<int, int> { { 1, 0 }, { 2, 0 }, { 3, 0 }, { 4, 0 }, { 5, 0 } },
            };
        }

        var reasonCounts = new Dictionary<string, int>();
        foreach (var reason in Enum.GetValues<FeedbackDissatisfactionReason>())
        {
            if (reason == FeedbackDissatisfactionReason.None) continue;
            var count = all.Count(f => !f.WasSatisfied && f.DissatisfactionReasons.HasFlag(reason));
            if (count > 0) reasonCounts[reason.ToString()] = count;
        }

        var ratingDist = new Dictionary<int, int>();
        for (int i = 1; i <= 5; i++)
            ratingDist[i] = all.Count(f => f.OverallRating == i);

        return new FeedbackSummaryDto
        {
            TotalCount = all.Count,
            ReviewedCount = all.Count(f => f.IsReviewed),
            UnreviewedCount = all.Count(f => !f.IsReviewed),
            AverageRating = Math.Round(all.Average(f => f.OverallRating), 2),
            AverageSprintsUsed = Math.Round(all.Average(f => (double)f.SprintsUsed), 1),
            SatisfiedCount = all.Count(f => f.WasSatisfied),
            UnsatisfiedCount = all.Count(f => !f.WasSatisfied),
            EncounteredBugsCount = all.Count(f => f.EncounteredBugs),
            WouldTryAgainCount = all.Count(f => f.WouldTryAgain),
            DissatisfactionReasonCounts = reasonCounts,
            RatingDistribution = ratingDist,
        };
    }

    // ── Helpers ─────────────────────────────────────────────

    private static FeedbackDissatisfactionReason ParseReasons(IEnumerable<string> names)
    {
        var result = FeedbackDissatisfactionReason.None;
        foreach (var name in names)
        {
            if (Enum.TryParse<FeedbackDissatisfactionReason>(name, ignoreCase: true, out var parsed))
                result |= parsed;
        }
        return result;
    }

    private static List<string> SplitReasons(FeedbackDissatisfactionReason flags)
    {
        var result = new List<string>();
        foreach (var value in Enum.GetValues<FeedbackDissatisfactionReason>())
        {
            if (value == FeedbackDissatisfactionReason.None) continue;
            if (flags.HasFlag(value)) result.Add(value.ToString());
        }
        return result;
    }

    private static string? Truncate(string? input, int max)
    {
        if (string.IsNullOrWhiteSpace(input)) return null;
        var trimmed = input.Trim();
        return trimmed.Length > max ? trimmed[..max] : trimmed;
    }

    private static FeedbackDto MapToDto(Feedback f) => new()
    {
        Id = f.Id,
        UserId = f.UserId,
        UserName = f.User?.Name ?? "",
        UserEmail = f.User?.Email ?? "",
        Language = f.Language,
        SprintsUsed = f.SprintsUsed,
        OverallRating = f.OverallRating,
        WasSatisfied = f.WasSatisfied,
        DissatisfactionReasons = SplitReasons(f.DissatisfactionReasons),
        MissedFunctionalities = f.MissedFunctionalities,
        HardestToFind = f.HardestToFind,
        DaysToGetUsedTo = f.DaysToGetUsedTo,
        MissedIntegrations = f.MissedIntegrations,
        AcceptableMonthlyPricePerUser = f.AcceptableMonthlyPricePerUser,
        OtherReasonDescription = f.OtherReasonDescription,
        UnmentionedFlawDescription = f.UnmentionedFlawDescription,
        MostUsefulFeature = f.MostUsefulFeature,
        EncounteredBugs = f.EncounteredBugs,
        BugContext = f.BugContext,
        WouldTryAgain = f.WouldTryAgain,
        IsReviewed = f.IsReviewed,
        CreatedAt = f.CreatedAt,
        ReviewedByUserName = f.ReviewedByUser?.Name,
        ReviewedAt = f.ReviewedAt,
    };
}