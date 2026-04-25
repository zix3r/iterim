using iterimApi.DTOs.WorkItems;

namespace iterimApi.Services.Interfaces;

public interface IWorkItemDependencyService
{
    Task<WorkItemDependenciesDto> GetDependenciesAsync(int workItemId, int userId);
    Task<WorkItemDependencyDto> AddDependencyAsync(int workItemId, int blockerWorkItemId, int userId);
    Task RemoveDependencyAsync(int dependencyId, int userId);
    Task<List<WorkItemDependencyDto>> GetUnfinishedBlockersAsync(int workItemId);
    Task<IEnumerable<WorkItemDto>> SearchWorkItemsAsync(string query, int userId);
}
