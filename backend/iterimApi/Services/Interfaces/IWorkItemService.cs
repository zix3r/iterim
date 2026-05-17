using iterimApi.DTOs.WorkItems;

namespace iterimApi.Services.Interfaces;

public interface IWorkItemService
{
    Task<IEnumerable<WorkItemDto>> GetWorkItemsByTeamAsync(int teamId, WorkItemFilterDto filters, int userId);
    Task<IEnumerable<BacklogGroupDto>> GetBacklogGroupedByIterationAsync(int teamId, int userId);
    Task<WorkItemDto?> GetWorkItemByIdAsync(int id, int userId);
    Task<WorkItemDto?> CreateWorkItemAsync(int teamId, CreateWorkItemDto dto, int userId);
    Task<WorkItemDto?> UpdateWorkItemAsync(int id, UpdateWorkItemDto dto, int userId);
    /// <summary>
    /// Partial update — currently only the assignee. Used by ATPA suggestions
    /// pipeline so the FE can apply assignments without having to re-send the
    /// entire work item payload.
    /// </summary>
    Task<WorkItemDto?> AssignWorkItemAsync(int id, int? assignedTo, int userId);
    Task<WorkItemDto?> TransferWorkItemAsync(int id, int targetTeamId, int userId);
    Task<bool> DeleteWorkItemAsync(int id, int userId);
    Task ReorderWorkItemsAsync(int teamId, ReorderWorkItemsDto dto, int userId);
    Task<int> BulkCreateWorkItemsAsync(int teamId, BulkCreateWorkItemsDto dto, int userId);
}
