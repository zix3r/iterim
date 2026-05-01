using iterimApi.DTOs.Tags;

namespace iterimApi.Services.Interfaces;

public interface ITagService
{
    Task<IEnumerable<TagDto>> GetOrgTagsAsync(int orgId, int userId);
    Task<TagDto> CreateTagAsync(int orgId, CreateTagDto dto, int userId);
    Task<bool> DeleteTagAsync(int orgId, int tagId, int userId);
    Task<IEnumerable<TagDto>> AssignTagsToWorkItemAsync(int workItemId, AssignTagsDto dto, int userId);
    Task<IEnumerable<TagDto>> AssignTagsToTeamMemberAsync(int teamId, int teamMemberId, AssignTagsDto dto, int userId);
}
