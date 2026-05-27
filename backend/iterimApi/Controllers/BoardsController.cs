using iterimApi.DTOs.Boards;
using iterimApi.Services.Interfaces;
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
    [HttpGet("{iterationId}")]
    public async Task<ActionResult<BoardDto>> GetBoardByIteration(int teamId, int iterationId)
    {
        var board = await _boardService.GetBoardByIterationIdAsync(teamId, iterationId);

        if (board == null)
        {
            // Pagal tavo Frontend api.ts logiką, jei grįžta 404, parodoma tuščia būsena.
            return NotFound(new { message = "Board for the specified iteration was not found." });
        }

        return Ok(board);
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