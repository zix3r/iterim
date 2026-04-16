namespace iterimApi.DTOs;

public class PinnedTeamDto
{
    public int TeamId { get; set; }
    public string TeamName { get; set; } = string.Empty;
    public int OrgId { get; set; }
    public int ProductId { get; set; }
    public string Path { get; set; } = string.Empty;
}
