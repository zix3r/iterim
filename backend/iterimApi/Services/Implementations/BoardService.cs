using iterimApi.Data;
using iterimApi.DTOs.Boards;
using iterimApi.DTOs.Iterations;
using iterimApi.DTOs.Tags;
using Microsoft.EntityFrameworkCore;
using iterimApi.Models.Enums;
using iterimApi.Services.Interfaces;

namespace iterimApi.Services.Implementations 
{
    public class BoardService : IBoardService
    {
        private readonly AppDbContext _context;

        public BoardService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<BoardDto?> GetActiveSprintBoardAsync(int teamId)
        {
            // 1. Randame aktyvų sprintą šiai komandai
            var activeIteration = await _context.Iterations
                .Include(i => i.WorkItems)
                    .ThenInclude(wi => wi.AssignedMember)
                        .ThenInclude(tm => tm!.OrgMember)
                            .ThenInclude(om => om.User)
                .Include(i => i.WorkItems)
                    .ThenInclude(wi => wi.Tags)
                        .ThenInclude(wit => wit.Tag)
                .Include(i => i.WorkItems)
                    .ThenInclude(wi => wi.BlockedBy)
                        .ThenInclude(d => d.BlockerWorkItem)
                            .ThenInclude(bwi => bwi.Team)
                                .ThenInclude(t => t.Product)
                                    .ThenInclude(p => p.Organization)
                .Include(i => i.WorkItems)
                    .ThenInclude(wi => wi.Comments)
                .Where(i => i.TeamId == teamId && i.Status == IterationStatus.Active)
                .FirstOrDefaultAsync();

            if (activeIteration == null)
            {
                return null;
            }

            // 2. Paruošiame Iteration informaciją
            var iterationDto = new IterationDto
            {
                Id = activeIteration.Id,
                TeamId = activeIteration.TeamId,
                Name = activeIteration.Name,
                StartDate = activeIteration.StartDate,
                EndDate = activeIteration.EndDate,
                Goal = activeIteration.Goal,
                Status = activeIteration.Status.ToString(),
                CreatedAt = activeIteration.CreatedAt,
                UpdatedAt = activeIteration.UpdatedAt,
                CreatedBy = activeIteration.CreatedBy,
                UpdatedBy = activeIteration.UpdatedBy,
                CreatedByName = "", 
                UpdatedByName = "",
                WorkItemCount = activeIteration.WorkItems?.Count ?? 0,
                TotalPoints = activeIteration.WorkItems?.Sum(wi => wi.Points ?? 0) ?? 0
            };

            // 3. Stulpelių generavimas pagal WorkItemStatus enum'ą
            var statuses = new[] { "Todo", "InProgress", "Review", "Done" };
            var columns = new List<BoardColumnDto>();

            foreach (var status in statuses)
            {
                var itemsInStatus = activeIteration.WorkItems?
                    .Where(wi => wi.Status.ToString() == status)
                    .Select(wi => new BoardWorkItemDto
                    {
                        Id = wi.Id,
                        Title = wi.Title,
                        Type = wi.Type.ToString(),
                        Points = wi.Points,
                        CommentCount = wi.Comments.Count,
                        AssignedMember = wi.AssignedMember != null ? new AssignedMemberDto
                        {
                            Id = wi.AssignedMember.Id,
                            FullName = wi.AssignedMember.OrgMember.User.Name,
                            AvatarUrl = wi.AssignedMember.OrgMember.User.AvatarUrl
                        } : null,
                        Tags = wi.Tags.Select(wit => new TagDto
                        {
                            Id = wit.Tag.Id,
                            OrganizationId = wit.Tag.OrganizationId,
                            Name = wit.Tag.Name,
                            Color = wit.Tag.Color,
                            CreatedAt = wit.Tag.CreatedAt
                        }).ToList(),
                        Blockers = wi.BlockedBy.Select(d => new BoardBlockerDto
                        {
                            DependencyId = d.Id,
                            WorkItemId = d.BlockerWorkItemId,
                            Title = d.BlockerWorkItem.Title,
                            Status = d.BlockerWorkItem.Status.ToString(),
                            TeamId = d.BlockerWorkItem.TeamId,
                            TeamName = d.BlockerWorkItem.Team.Name,
                            ProductId = d.BlockerWorkItem.Team.ProductId,
                            ProductName = d.BlockerWorkItem.Team.Product.Name,
                            OrgId = d.BlockerWorkItem.Team.Product.OrganizationId
                        }).ToList()
                    }).ToList() ?? new List<BoardWorkItemDto>();

                columns.Add(new BoardColumnDto
                {
                    Status = status,
                    TotalPoints = itemsInStatus.Sum(i => i.Points ?? 0),
                    WorkItems = itemsInStatus
                });
            }

            return new BoardDto
            {
                Iteration = iterationDto,
                Columns = columns
            };
        }
    }
}