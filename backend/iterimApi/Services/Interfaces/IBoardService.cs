using iterimApi.DTOs.Boards;

namespace iterimApi.Services.Interfaces;

public interface IBoardService
{
    Task<BoardDto?> GetActiveIterationBoardAsync(int teamId);
}