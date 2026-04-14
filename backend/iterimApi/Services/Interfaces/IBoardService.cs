using iterimApi.DTOs.Boards;

namespace iterimApi.Services.Interfaces;

public interface IBoardService
{
    Task<BoardDto?> GetActiveSprintBoardAsync(int teamId);
}