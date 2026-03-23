namespace iterimApi.DTOs.Boards;

public class BoardWorkItemDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty; 
    public int? Points { get; set; }
    public AssignedMemberDto? AssignedMember { get; set; } 
}

public class AssignedMemberDto
{
    public int Id { get; set; }
    public string FullName { get; set; } = string.Empty;
}