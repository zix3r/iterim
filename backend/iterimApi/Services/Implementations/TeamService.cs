using iterimApi.Data;
using iterimApi.DTOs.Tags;
using iterimApi.DTOs.Teams;
using iterimApi.Models.Entities;
using iterimApi.Models.Enums;
using iterimApi.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using iterimApi.DTOs.Planning;

namespace iterimApi.Services.Implementations;

public class TeamService : ITeamService
{
    private readonly AppDbContext _db;
    private readonly INotificationService _notifications;

    public TeamService(AppDbContext db, INotificationService notifications)
    {
        _db = db;
        _notifications = notifications;
    }

    public async Task<IEnumerable<TeamDto>> GetTeamsByProductAsync(int productId, int userId)
    {
        // Check if product exists and user has access
        var product = await _db.Products
            .Include(p => p.Organization)
            .FirstOrDefaultAsync(p => p.Id == productId);

        if (product == null)
        {
            throw new KeyNotFoundException("Product not found");
        }

        // Check if user is a member of the organization
        var isMember = await _db.OrganizationMembers
            .AnyAsync(m => m.OrganizationId == product.OrganizationId && 
                          m.UserId == userId && 
                          m.Status == OrgMemberStatus.Active);

        if (!isMember)
        {
            throw new UnauthorizedAccessException("User is not a member of this organization");
        }

        // Get all teams for the product
        var teams = await _db.Teams
            .Where(t => t.ProductId == productId)
            .Include(t => t.CreatedByUser)
            .Include(t => t.UpdatedByUser)
            .Include(t => t.Members)
            .Select(t => new TeamDto
            {
                Id = t.Id,
                ProductId = t.ProductId,
                Name = t.Name,
                Description = t.Description,
                CreatedAt = t.CreatedAt,
                UpdatedAt = t.UpdatedAt,
                CreatedBy = t.CreatedBy,
                UpdatedBy = t.UpdatedBy,
                CreatedByName = t.CreatedByUser.Name,
                UpdatedByName = t.UpdatedByUser.Name,
                MemberCount = t.Members.Count
            })
            .ToListAsync();

        return teams;
    }
   public async Task<QuarterPlanDto> GetQuarterPlanAsync(int teamId, DateOnly start, DateOnly end)
{
    var result = new QuarterPlanDto();

    // 1. Gauname Iteracijas
    var iterations = await _db.Iterations
        .Where(i => i.TeamId == teamId && i.StartDate <= end && i.EndDate >= start)
        .OrderBy(i => i.StartDate)
        .ToListAsync();

    if (!iterations.Any())
        return result;

    var iterationIds = iterations.Select(i => i.Id).ToList();

    // 2. Gauname Work Items
    var workItems = await _db.WorkItems
        .Where(w => w.TeamId == teamId && w.IterationId.HasValue && iterationIds.Contains(w.IterationId.Value))
        .ToListAsync();

    // 3. Gauname komandos narius ir absences
    var teamMembers = await _db.TeamMembers
        .Include(tm => tm.OrgMember)
        .Where(tm => tm.TeamId == teamId)
        .ToListAsync();
        
    var orgMemberIds = teamMembers.Select(tm => tm.OrgMemberId).ToList();
    
    var absences = await _db.MemberAbsences
        .Where(a => orgMemberIds.Contains(a.OrgMemberId) && a.FromDate <= end && a.ToDate >= start)
        .ToListAsync();

    // 4. Formuojame Iteration Summaries
    foreach (var iter in iterations)
    {
        var iterItems = workItems.Where(w => w.IterationId == iter.Id).ToList();

        // PATAISYTA: Naudojame WorkItemStatus Enums!
        int totalSP = iterItems.Sum(w => w.Points ?? 0);
        int doneSP = iterItems.Where(w => w.Status == WorkItemStatus.Done).Sum(w => w.Points ?? 0);
        int inProgressSP = iterItems.Where(w => w.Status == WorkItemStatus.InProgress || w.Status == WorkItemStatus.Review).Sum(w => w.Points ?? 0);
        int todoSP = iterItems.Where(w => w.Status == WorkItemStatus.Todo || w.Status == WorkItemStatus.Backlog).Sum(w => w.Points ?? 0);

        result.Iterations.Add(new IterationSummaryDto
        {
            Id = iter.Id,
            Name = iter.Name ?? string.Empty,
            StartDate = iter.StartDate,
            EndDate = iter.EndDate,
            Status = iter.Status.ToString(), // PATAISYTA: Enum to string
            TotalSP = totalSP,
            DoneSP = doneSP,
            InProgressSP = inProgressSP,
            TodoSP = todoSP,
            WorkItems = iterItems.Select(w => new QuarterWorkItemDto 
            { 
                Id = w.Id, 
                Title = w.Title, 
                Type = w.Type.ToString(),     // PATAISYTA: Enum to string
                Status = w.Status.ToString(), // PATAISYTA: Enum to string
                Points = w.Points 
            }).ToList()
        });

        int totalWorkDaysInIter = CalculateWorkingDays(iter.StartDate, iter.EndDate);
        int grossCapacity = totalWorkDaysInIter * teamMembers.Count;

        int absenceDaysInIter = 0;
        foreach (var abs in absences)
        {
            var overlapStart = abs.FromDate > iter.StartDate ? abs.FromDate : iter.StartDate;
            var overlapEnd = abs.ToDate < iter.EndDate ? abs.ToDate : iter.EndDate;
            
            if (overlapStart <= overlapEnd)
            {
                absenceDaysInIter += CalculateWorkingDays(overlapStart, overlapEnd);
            }
        }

        result.CapacityPerIteration.Add(new IterationCapacityDto
        {
            IterationId = iter.Id,
            TotalWorkDays = grossCapacity,
            TotalAbsenceDays = absenceDaysInIter,
            NetCapacityDays = grossCapacity - absenceDaysInIter
        });
    }

    // 5. Feature Spanning logika
    result.FeatureSummaries = workItems
        .Where(w => w.Type == WorkItemType.Story) // PATAISYTA: Naudojame WorkItemType Enum
        .GroupBy(w => w.Title) 
        .Where(g => g.Select(x => x.IterationId).Distinct().Count() > 1)
        .Select(g => new FeatureSpanDto
        {
            WorkItemId = g.First().Id,
            WorkItemTitle = g.Key,
            Type = g.First().Type.ToString(), // PATAISYTA: Enum to string
            StartIterationId = g.OrderBy(x => x.IterationId).First().IterationId ?? 0,
            EndIterationId = g.OrderByDescending(x => x.IterationId).First().IterationId ?? 0,
            TotalSP = g.Sum(x => x.Points ?? 0),
            CompletionPercent = g.Sum(x => x.Points ?? 0) == 0 ? 0 : 
                (int)((double)g.Where(x => x.Status == WorkItemStatus.Done).Sum(x => x.Points ?? 0) / g.Sum(x => x.Points ?? 0) * 100)
        }).ToList();

    return result;
}

// Pagalbinis metodas darbo dienoms skaičiuoti (be savaitgalių)
private int CalculateWorkingDays(DateOnly start, DateOnly end)
{
    int count = 0;
    for (var date = start; date <= end; date = date.AddDays(1))
    {
        if (date.DayOfWeek != DayOfWeek.Saturday && date.DayOfWeek != DayOfWeek.Sunday)
            count++;
    }
    return count;
}
    public async Task UpdateMemberScheduleAsync(int teamId, int teamMemberId, UpdateTeamMemberScheduleDto dto, int userId)
    {
        var teamMember = await _db.TeamMembers
            .Include(tm => tm.Team)
            .FirstOrDefaultAsync(tm => tm.TeamId == teamId && tm.Id == teamMemberId);

        if (teamMember == null)
            throw new KeyNotFoundException("Team member not found.");

        // Patikriname ar vartotojas turi teisę (Team Leader / Admin)
        // (Naudok savo esamą metodą, pvz., EnsureTeamAdmin(teamId, userId) arba panašų)
        await EnsureTeamAdminAsync(teamId, userId); 

        if (!Enum.TryParse<WorkScheduleType>(dto.ScheduleType, out var typeEnum))
            throw new ArgumentException("Invalid schedule type.");

        teamMember.ScheduleType = typeEnum;
        
        // Priverstinai nustatome valandas, jei pasirinktas standartinis tipas
        teamMember.WeeklyHours = typeEnum switch
        {
            WorkScheduleType.FullTime => 40,
            WorkScheduleType.PartTime => 20,
            _ => dto.WeeklyHours
        };

        teamMember.UpdatedBy = userId;
        teamMember.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
    }
    public async Task<TeamDetailDto?> GetTeamByIdAsync(int teamId, int userId)
    {
        var team = await _db.Teams
            .Include(t => t.Product)
            .Include(t => t.CreatedByUser)
            .Include(t => t.UpdatedByUser)
            .Include(t => t.Members)
                .ThenInclude(m => m.OrgMember)
                .ThenInclude(om => om.User)
            .Include(t => t.Members)
                .ThenInclude(m => m.Tags)
                .ThenInclude(tmt => tmt.Tag)
            .FirstOrDefaultAsync(t => t.Id == teamId);

        if (team == null)
        {
            return null;
        }

        // Check if user is a member of the organization
        var isMember = await _db.OrganizationMembers
            .AnyAsync(m => m.OrganizationId == team.Product.OrganizationId && 
                          m.UserId == userId && 
                          m.Status == OrgMemberStatus.Active);

        if (!isMember)
        {
            throw new UnauthorizedAccessException("User is not a member of this organization");
        }

        return new TeamDetailDto
        {
            Id = team.Id,
            ProductId = team.ProductId,
            ProductName = team.Product.Name,
            ProductCreatedBy = team.Product.CreatedBy,
            CurrentUserId = userId,
            Name = team.Name,
            Description = team.Description,
            CreatedAt = team.CreatedAt,
            UpdatedAt = team.UpdatedAt,
            CreatedBy = team.CreatedBy,
            UpdatedBy = team.UpdatedBy,
            CreatedByName = team.CreatedByUser.Name,
            UpdatedByName = team.UpdatedByUser.Name,
            Members = team.Members.Select(m => new TeamMemberDto
            {
                Id = m.Id,
                TeamId = m.TeamId,
                OrgMemberId = m.OrgMemberId,
                UserId = m.OrgMember.UserId,
                UserName = m.OrgMember.User.Name,
                UserEmail = m.OrgMember.User.Email,
                Role = m.Role.ToString(),
                CreatedAt = m.CreatedAt,
                RoleGrantedByUserId = m.RoleGrantedByUserId,
                CreatedByUserId = m.CreatedBy,

                WeeklyHours = m.WeeklyHours,
                ScheduleType = m.ScheduleType.ToString(),
                Tags = m.Tags.Select(tmt => new TagDto
                {
                    Id = tmt.Tag.Id,
                    OrganizationId = tmt.Tag.OrganizationId,
                    Name = tmt.Tag.Name,
                    Color = tmt.Tag.Color,
                    CreatedAt = tmt.Tag.CreatedAt
                }).ToList()
            }).ToList()
        };
    }

    public async Task<TeamDto?> CreateTeamAsync(int productId, CreateTeamDto dto, int userId)
    {
        // Check if product exists
        var product = await _db.Products
            .Include(p => p.Organization)
            .FirstOrDefaultAsync(p => p.Id == productId);

        if (product == null)
        {
            throw new KeyNotFoundException("Product not found");
        }

        // Check if user is a member of the organization with appropriate permissions
        var member = await _db.OrganizationMembers
            .FirstOrDefaultAsync(m => m.OrganizationId == product.OrganizationId && 
                                     m.UserId == userId && 
                                     m.Status == OrgMemberStatus.Active);

        if (member == null)
        {
            throw new UnauthorizedAccessException("User is not a member of this organization");
        }

        // Only Admin or ProductOwner can create teams
        if (member.Role != OrgMemberRole.Admin /*&& member.Role != OrgMemberRole.ProductOwner*/)
        {
            throw new UnauthorizedAccessException("User does not have permission to create teams");
        }

        var team = new Team
        {
            ProductId = productId,
            Name = dto.Name,
            Description = dto.Description,
            CreatedBy = userId,
            UpdatedBy = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _db.Teams.Add(team);
        await _db.SaveChangesAsync();

        // Automatically add the creator as a team admin
        var creatorTeamMember = new TeamMember
        {
            TeamId = team.Id,
            OrgMemberId = member.Id,
            Role = TeamMemberRole.Admin,
            CreatedBy = userId,
            UpdatedBy = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            // Komandos kūrėjas yra savaiminis admin — niekas „nesuteikė" rolės;
            // savininko apsauga užtikrinama per Team.CreatedBy.
            RoleGrantedByUserId = null
        };
        
        _db.TeamMembers.Add(creatorTeamMember);
        await _db.SaveChangesAsync();

        // Load navigation properties for DTO
        await _db.Entry(team).Reference(t => t.CreatedByUser).LoadAsync();
        await _db.Entry(team).Reference(t => t.UpdatedByUser).LoadAsync();
        await _db.Entry(team).Collection(t => t.Members).LoadAsync();

        return new TeamDto
        {
            Id = team.Id,
            ProductId = team.ProductId,
            Name = team.Name,
            Description = team.Description,
            CreatedAt = team.CreatedAt,
            UpdatedAt = team.UpdatedAt,
            CreatedBy = team.CreatedBy,
            UpdatedBy = team.UpdatedBy,
            CreatedByName = team.CreatedByUser.Name,
            UpdatedByName = team.UpdatedByUser.Name,
            MemberCount = team.Members.Count
        };
    }

    public async Task<TeamDto?> UpdateTeamAsync(int teamId, UpdateTeamDto dto, int userId)
    {
        // Check if team exists
        var team = await _db.Teams
            .Include(t => t.Product)
            .Include(t => t.CreatedByUser)
            .Include(t => t.UpdatedByUser)
            .Include(t => t.Members)
            .FirstOrDefaultAsync(t => t.Id == teamId);

        if (team == null)
        {
            throw new KeyNotFoundException("Team not found");
        }

        // Check if the requester is a member of the organization
        var requesterMember = await _db.OrganizationMembers
            .FirstOrDefaultAsync(m => m.OrganizationId == team.Product.OrganizationId && 
                                     m.UserId == userId && 
                                     m.Status == OrgMemberStatus.Active);

        if (requesterMember == null)
        {
            throw new UnauthorizedAccessException("User is not a member of this organization");
        }

        // Check if user can manage this team (product creator OR team admin)
        var isProductCreator = team.Product.CreatedBy == userId;
        var isTeamAdmin = await _db.TeamMembers
            .AnyAsync(tm => tm.TeamId == teamId && 
                           tm.OrgMember.UserId == userId && 
                           tm.Role == TeamMemberRole.Admin);

        if (!isProductCreator && !isTeamAdmin)
        {
            throw new UnauthorizedAccessException("Only the product creator or team admin can update the team");
        }

        // Update team properties
        team.Name = dto.Name;
        team.Description = dto.Description;
        team.UpdatedBy = userId;
        team.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        // Reload navigation properties to get updated user names
        await _db.Entry(team).Reference(t => t.UpdatedByUser).LoadAsync();

        return new TeamDto
        {
            Id = team.Id,
            ProductId = team.ProductId,
            Name = team.Name,
            Description = team.Description,
            CreatedAt = team.CreatedAt,
            UpdatedAt = team.UpdatedAt,
            CreatedBy = team.CreatedBy,
            UpdatedBy = team.UpdatedBy,
            CreatedByName = team.CreatedByUser.Name,
            UpdatedByName = team.UpdatedByUser.Name,
            MemberCount = team.Members.Count
        };
    }

    public async Task<TeamMemberDto?> AddTeamMemberAsync(int teamId, AddTeamMemberDto dto, int userId)
    {
        // Check if team exists
        var team = await _db.Teams
            .Include(t => t.Product)
            .FirstOrDefaultAsync(t => t.Id == teamId);

        if (team == null)
        {
            throw new KeyNotFoundException("Team not found");
        }

        // Check if the requester is a member of the organization with appropriate permissions
        var requesterMember = await _db.OrganizationMembers
            .FirstOrDefaultAsync(m => m.OrganizationId == team.Product.OrganizationId && 
                                     m.UserId == userId && 
                                     m.Status == OrgMemberStatus.Active);

        if (requesterMember == null)
        {
            throw new UnauthorizedAccessException("User is not a member of this organization");
        }

        // Check if user can manage this team (product creator OR team admin)
        var isProductCreator = team.Product.CreatedBy == userId;
        var isTeamAdmin = await _db.TeamMembers
            .AnyAsync(tm => tm.TeamId == teamId && 
                           tm.OrgMember.UserId == userId && 
                           tm.Role == TeamMemberRole.Admin);

        if (!isProductCreator && !isTeamAdmin)
        {
            throw new UnauthorizedAccessException("Only the product creator or team admin can add members");
        }

        // Check if the organization member exists
        var orgMember = await _db.OrganizationMembers
            .Include(om => om.User)
            .FirstOrDefaultAsync(om => om.Id == dto.OrgMemberId && 
                                      om.OrganizationId == team.Product.OrganizationId &&
                                      om.Status == OrgMemberStatus.Active);

        if (orgMember == null)
        {
            throw new KeyNotFoundException("Organization member not found or not active");
        }

        // Check if user is already a member of this team
        var existingMember = await _db.TeamMembers
            .FirstOrDefaultAsync(tm => tm.TeamId == teamId && tm.OrgMemberId == dto.OrgMemberId);

        if (existingMember != null)
        {
            throw new InvalidOperationException("User is already a member of this team");
        }

        var teamMember = new TeamMember
        {
            TeamId = teamId,
            OrgMemberId = dto.OrgMemberId,
            Role = dto.Role,
            CreatedBy = userId,
            UpdatedBy = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            // Užfiksuojame, kas suteikė Admin rolę (jei iškart prisidedamas kaip Admin).
            RoleGrantedByUserId = dto.Role == TeamMemberRole.Admin ? userId : (int?)null
        };

        _db.TeamMembers.Add(teamMember);
        await _db.SaveChangesAsync();

        // ── Notification: user added to team ─────────────────────
        if (orgMember.UserId != userId)
        {
            await _notifications.CreateAsync(
                orgMember.UserId,
                NotificationType.AddedToTeam,
                "notifications.addedToTeam.title",
                "notifications.addedToTeam.message",
                new Dictionary<string, string>
                {
                    ["teamName"] = team.Name
                },
                $"/org/{team.Product.OrganizationId}/products/{team.ProductId}/teams/{team.Id}");
        }

        return new TeamMemberDto
        {
            Id = teamMember.Id,
            TeamId = teamMember.TeamId,
            OrgMemberId = teamMember.OrgMemberId,
            UserId = orgMember.UserId,
            UserName = orgMember.User.Name,
            UserEmail = orgMember.User.Email,
            Role = teamMember.Role.ToString(),
            CreatedAt = teamMember.CreatedAt,
            RoleGrantedByUserId = teamMember.RoleGrantedByUserId,
            CreatedByUserId = teamMember.CreatedBy
        };
    }

    public async Task<TeamMemberDto?> UpdateTeamMemberRoleAsync(int teamId, int memberUserId, UpdateTeamMemberRoleDto dto, int userId)
    {
        // Check if team exists
        var team = await _db.Teams
            .Include(t => t.Product)
            .FirstOrDefaultAsync(t => t.Id == teamId);

        if (team == null)
        {
            throw new KeyNotFoundException("Team not found");
        }

        // Check if the requester is a member of the organization with appropriate permissions
        var requesterMember = await _db.OrganizationMembers
            .FirstOrDefaultAsync(m => m.OrganizationId == team.Product.OrganizationId && 
                                     m.UserId == userId && 
                                     m.Status == OrgMemberStatus.Active);

        if (requesterMember == null)
        {
            throw new UnauthorizedAccessException("User is not a member of this organization");
        }

        // Check if user can manage this team (product creator OR team admin)
        var isProductCreator = team.Product.CreatedBy == userId;
        var isTeamAdmin = await _db.TeamMembers
            .AnyAsync(tm => tm.TeamId == teamId && 
                           tm.OrgMember.UserId == userId && 
                           tm.Role == TeamMemberRole.Admin);

        if (!isProductCreator && !isTeamAdmin)
        {
            throw new UnauthorizedAccessException("Only the product creator or team admin can update member roles");
        }

        // Find the team member to update
        var teamMember = await _db.TeamMembers
            .Include(tm => tm.OrgMember)
                .ThenInclude(om => om.User)
            .FirstOrDefaultAsync(tm => tm.TeamId == teamId && tm.OrgMember.UserId == memberUserId);

        if (teamMember == null)
        {
            throw new KeyNotFoundException("Team member not found");
        }

        // ── Apsauga: narys negali keisti SAVO PATIES rolės ──────────
        // Nei aukštyn (promote), nei žemyn (demote). Komandos narys, net
        // ir būdamas admin, neturi teisės pats sau redaguoti rolės; tai
        // turi padaryti kitas admin / komandos kūrėjas / produkto kūrėjas.
        if (memberUserId == userId)
        {
            throw new InvalidOperationException(
                "Negalite pakeisti savo paties rolės komandoje.");
        }

        // ── Apsauga nuo savininko / kitų adminų DEMOTE'INIMO ─────────
        // Sumažinti komandos admin rolę gali tik:
        //   • komandos savininkas (Team.CreatedBy), arba
        //   • produkto kūrėjas (Product.CreatedBy), arba
        //   • tas admin, kuris pats šią rolę suteikė.
        bool isDemotion = teamMember.Role == TeamMemberRole.Admin && dto.Role == TeamMemberRole.Member;
        bool memberIsTeamCreator = team.CreatedBy == memberUserId;
        bool requesterIsTeamCreator = team.CreatedBy == userId;

        if (isDemotion)
        {
            if (memberIsTeamCreator && !requesterIsTeamCreator && !isProductCreator)
            {
                throw new UnauthorizedAccessException(
                    "Komandos kūrėjo (savininko) rolės sumažinti negalima.");
            }

            if (!requesterIsTeamCreator && !isProductCreator)
            {
                // Audit fallback: jei senuose duomenyse RoleGrantedByUserId NULL,
                // priimame TeamMember.CreatedBy — narį į komandą įtraukęs admin
                // dažniausiai ir nustatė rolę.
                int effectiveGranter = teamMember.RoleGrantedByUserId ?? teamMember.CreatedBy;
                bool requesterGrantedRole = effectiveGranter == userId;

                if (!requesterGrantedRole)
                {
                    throw new UnauthorizedAccessException(
                        "Sumažinti komandos administratoriaus rolę gali tik komandos kūrėjas, " +
                        "produkto kūrėjas arba tas administratorius, kuris šią rolę suteikė.");
                }
            }
        }

        // Esama apsauga: jei demote'inamas team creator ir jis vienintelis admin
        if (isDemotion && memberIsTeamCreator)
        {
            // Count how many admins are in the team
            var adminCount = await _db.TeamMembers
                .CountAsync(tm => tm.TeamId == teamId && tm.Role == TeamMemberRole.Admin);

            if (adminCount <= 1)
            {
                throw new InvalidOperationException("Cannot demote the team creator from admin when they are the only admin. Add another admin first.");
            }
        }

        // Update the role
        teamMember.Role = dto.Role;
        teamMember.UpdatedBy = userId;
        teamMember.UpdatedAt = DateTime.UtcNow;
        // Audit: kas suteikė naują rolę.
        teamMember.RoleGrantedByUserId = dto.Role == TeamMemberRole.Admin
            ? userId
            : (int?)null;

        await _db.SaveChangesAsync();

        return new TeamMemberDto
        {
            Id = teamMember.Id,
            TeamId = teamMember.TeamId,
            OrgMemberId = teamMember.OrgMemberId,
            UserId = teamMember.OrgMember.UserId,
            UserName = teamMember.OrgMember.User.Name,
            UserEmail = teamMember.OrgMember.User.Email,
            Role = teamMember.Role.ToString(),
            CreatedAt = teamMember.CreatedAt,
            RoleGrantedByUserId = teamMember.RoleGrantedByUserId,
            CreatedByUserId = teamMember.CreatedBy
        };
    }

    public async Task<bool> RemoveTeamMemberAsync(int teamId, int userId, int memberUserId)
    {
        // Check if team exists
        var team = await _db.Teams
            .Include(t => t.Product)
            .FirstOrDefaultAsync(t => t.Id == teamId);

        if (team == null)
        {
            throw new KeyNotFoundException("Team not found");
        }

        // Check if the requester is a member of the organization with appropriate permissions
        var requesterMember = await _db.OrganizationMembers
            .FirstOrDefaultAsync(m => m.OrganizationId == team.Product.OrganizationId && 
                                     m.UserId == userId && 
                                     m.Status == OrgMemberStatus.Active);

        if (requesterMember == null)
        {
            throw new UnauthorizedAccessException("User is not a member of this organization");
        }

        // Check if user can manage this team (product creator OR team admin)
        var isProductCreator = team.Product.CreatedBy == userId;
        var isTeamAdmin = await _db.TeamMembers
            .AnyAsync(tm => tm.TeamId == teamId && 
                           tm.OrgMember.UserId == userId && 
                           tm.Role == TeamMemberRole.Admin);

        if (!isProductCreator && !isTeamAdmin)
        {
            throw new UnauthorizedAccessException("Only the product creator or team admin can remove members");
        }

        // Find the team member to remove
        var teamMember = await _db.TeamMembers
            .Include(tm => tm.OrgMember)
            .FirstOrDefaultAsync(tm => tm.TeamId == teamId && tm.OrgMember.UserId == memberUserId);

        if (teamMember == null)
        {
            return false;
        }

        // Check if the member being removed is the team creator and the only admin
        var isTeamCreator = team.CreatedBy == memberUserId;
        if (isTeamCreator && teamMember.Role == TeamMemberRole.Admin)
        {
            // Count how many admins are in the team
            var adminCount = await _db.TeamMembers
                .CountAsync(tm => tm.TeamId == teamId && tm.Role == TeamMemberRole.Admin);

            if (adminCount <= 1)
            {
                throw new InvalidOperationException("Cannot remove the team creator when they are the only admin. Add another admin first.");
            }
        }

        _db.TeamMembers.Remove(teamMember);
        await _db.SaveChangesAsync();

        return true;
    }

    public async Task<bool> DeleteTeamAsync(int teamId, int userId)
    {
        // Check if team exists
        var team = await _db.Teams
            .Include(t => t.Product)
            .FirstOrDefaultAsync(t => t.Id == teamId);

        if (team == null)
        {
            throw new KeyNotFoundException("Team not found");
        }

        // Check if the requester is a member of the organization with appropriate permissions
        var requesterMember = await _db.OrganizationMembers
            .FirstOrDefaultAsync(m => m.OrganizationId == team.Product.OrganizationId && 
                                     m.UserId == userId && 
                                     m.Status == OrgMemberStatus.Active);

        if (requesterMember == null)
        {
            throw new UnauthorizedAccessException("User is not a member of this organization");
        }

        // Check if user can manage this team (product creator OR team admin)
        var isProductCreator = team.Product.CreatedBy == userId;
        var isTeamAdmin = await _db.TeamMembers
            .AnyAsync(tm => tm.TeamId == teamId && 
                           tm.OrgMember.UserId == userId && 
                           tm.Role == TeamMemberRole.Admin);

        if (!isProductCreator && !isTeamAdmin)
        {
            throw new UnauthorizedAccessException("Only the product creator or team admin can delete teams");
        }

        _db.Teams.Remove(team);
        await _db.SaveChangesAsync();

        return true;
    }
    private async Task EnsureTeamAdminAsync(int teamId, int userId)
    {
        var hasAccess = await _db.TeamMembers
            .Include(tm => tm.OrgMember)
            .AnyAsync(tm => tm.TeamId == teamId && tm.OrgMember.UserId == userId);

        // Jei turi specialias roles (pvz. TeamMemberRole.Leader), gali čia jas patikrinti.
        // Šiuo atveju tiesiog patikriname, ar jis apskritai priklauso komandai.
        if (!hasAccess)
        {
            throw new UnauthorizedAccessException("You do not have permission to modify this team member.");
        }
    }
}
