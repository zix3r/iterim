using iterimApi.Models.DTOs.Boards;

namespace iterimApi.Services;

public interface IBoardService
{
    Task<BoardDto?> GetActiveSprintBoardAsync(int teamId);
}