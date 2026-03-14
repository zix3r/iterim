using iterimApi.DTOs.Dashboard;

namespace iterimApi.Services.Interfaces;

public interface IDashboardService
{
    Task<DashboardDto> GetDashboardAsync(int userId);
}