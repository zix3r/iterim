using iterimApi.DTOs.WorkItems;

namespace iterimApi.Services.Interfaces;

public interface IWorkItemService
{
    Task<IEnumerable<WorkItemDto>> GetWorkItemsByTeamAsync(int teamId, WorkItemFilterDto filters, int userId);
    Task<IEnumerable<BacklogGroupDto>> GetBacklogGroupedByIterationAsync(int teamId, int userId);
    Task<WorkItemDto?> GetWorkItemByIdAsync(int id, int userId);
    Task<WorkItemDto?> CreateWorkItemAsync(int teamId, CreateWorkItemDto dto, int userId);
    Task<WorkItemDto?> UpdateWorkItemAsync(int id, UpdateWorkItemDto dto, int userId);
    Task<bool> DeleteWorkItemAsync(int id, int userId);
    Task ReorderWorkItemsAsync(int teamId, ReorderWorkItemsDto dto, int userId);
}
