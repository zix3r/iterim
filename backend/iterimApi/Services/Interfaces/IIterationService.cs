using iterimApi.DTOs.Iterations;

namespace iterimApi.Services.Interfaces;

public interface IIterationService
{
    Task<IEnumerable<IterationDto>> GetIterationsByTeamAsync(int teamId, int userId);
    Task<IterationDto?> GetIterationByIdAsync(int id, int userId);
    Task<IterationDto?> CreateIterationAsync(int teamId, CreateIterationDto dto, int userId);
    Task<IterationDto?> UpdateIterationAsync(int id, UpdateIterationDto dto, int userId);
    Task<IterationDto?> StartIterationAsync(int id, int userId);
    Task<IterationDto?> CompleteIterationAsync(int id, int userId, int? moveUnfinishedToIterationId = null);
    Task<bool> DeleteIterationAsync(int id, int userId);
}
