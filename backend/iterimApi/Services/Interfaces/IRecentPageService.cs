using iterimApi.DTOs.Users;

namespace iterimApi.Services.Interfaces;

public interface IRecentPageService
{
    Task AddRecentPageAsync(int userId, RecentPageDto dto);
    Task<List<RecentPageDto>> GetRecentPagesAsync(int userId);
    Task ClearRecentPagesAsync(int userId);
}