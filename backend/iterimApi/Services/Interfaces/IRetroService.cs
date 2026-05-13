using iterimApi.DTOs.Retro;

namespace iterimApi.Services.Interfaces;

public interface IRetroService
{
    Task<RetroBoardDto> GetRetroBoardAsync(int teamId, int iterationId, int userId);
    Task<RetroItemDto> CreateRetroItemAsync(int teamId, int iterationId, CreateRetroItemDto dto, int userId);
    Task<RetroItemDto> UpdateRetroItemAsync(int teamId, int iterationId, int itemId, UpdateRetroItemDto dto, int userId);
    Task DeleteRetroItemAsync(int teamId, int iterationId, int itemId, int userId);
    Task<RetroItemDto> ToggleVoteAsync(int teamId, int iterationId, int itemId, int userId);
}
