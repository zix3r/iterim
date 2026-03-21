using iterimApi.Models.DTOs.Boards;
using iterimApi.Services;
using Microsoft.AspNetCore.Mvc;

namespace iterimApi.Controllers;

[ApiController]
[Route("api/teams/{teamId}/[controller]")]
public class BoardsController : ControllerBase
{
    private readonly IBoardService _boardService;

    public BoardsController(IBoardService boardService)
    {
        _boardService = boardService;
    }

    [HttpGet("active")]
    public async Task<ActionResult<BoardDto>> GetActiveBoard(int teamId)
    {
        var board = await _boardService.GetActiveSprintBoardAsync(teamId);

        if (board == null)
        {
            return NotFound(new { message = "No active sprint found for this team." });
        }

        return Ok(board);
    }
}