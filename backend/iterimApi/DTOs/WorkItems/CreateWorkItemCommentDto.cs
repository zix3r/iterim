using System.ComponentModel.DataAnnotations;

namespace iterimApi.DTOs.WorkItems;

public class CreateWorkItemCommentDto
{
    [Required]
    [MinLength(1, ErrorMessage = "Comment cannot be empty")]
    [MaxLength(5000, ErrorMessage = "Comment cannot exceed 5000 characters")]
    public string Content { get; set; } = string.Empty;
}
