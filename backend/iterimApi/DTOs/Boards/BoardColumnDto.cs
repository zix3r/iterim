namespace iterimApi.DTOs
{
    public class BoardColumnDto
    {
        public string Status { get; set; } = string.Empty;
        public int TotalPoints { get; set; }
        public List<BoardWorkItemDto> WorkItems { get; set; } = new();
    }
}