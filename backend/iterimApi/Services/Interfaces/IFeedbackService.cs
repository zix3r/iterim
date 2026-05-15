using iterimApi.DTOs.Feedback;

namespace iterimApi.Services.Interfaces;

public interface IFeedbackService
{
    Task<FeedbackDto> CreateAsync(int userId, CreateFeedbackDto dto);
    Task<FeedbackListResponseDto> GetAllAsync(
        int page,
        int pageSize,
        bool? isReviewed = null,
        bool? wasSatisfied = null,
        bool? encounteredBugs = null,
        bool? wouldTryAgain = null);
    Task<FeedbackDto?> ToggleReviewedAsync(int feedbackId, int reviewerUserId);
    Task<FeedbackSummaryDto> GetSummaryAsync();
}