using iterimApi.DTOs.Iterations;

namespace iterimApi.DTOs.Boards;

public class BoardDto
{
    public IterationDto Iteration { get; set; } = null!;
    public List<BoardColumnDto> Columns { get; set; } = new();
}
