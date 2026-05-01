using Microsoft.EntityFrameworkCore;
using iterimApi.Data;
using iterimApi.DTOs.Admin;
using iterimApi.Services.Interfaces; // Pridėta!

namespace iterimApi.Services.Implementations; // Atnaujinta!

public class AdminOrganizationService : IAdminOrganizationService
{
    private readonly AppDbContext _db;

    public AdminOrganizationService(AppDbContext db)
    {
        _db = db;
    }

   public async Task<IEnumerable<AdminOrganizationListDto>> GetOrganizationsAsync()
    {
        // 1. Parsiunčiame duomenis saugiu būdu, naudodami .Include()
        var orgs = await _db.Organizations
            .Include(o => o.Members)
            .Include(o => o.Products)
                .ThenInclude(p => p.Teams)
            .ToListAsync();

        // 2. Skaičiavimus atliekame C# atmintyje (tai apsaugo nuo 500 SQL klaidų)
        return orgs.Select(o => new AdminOrganizationListDto
        {
            Id = o.Id,
            Name = o.Name,
            Slug = o.Slug,
            // Saugiai skaičiuojame kiekius, apsisaugant nuo 'null' reikšmių
            MemberCount = o.Members?.Count ?? 0,
            ProductCount = o.Products?.Count ?? 0,
            TeamCount = o.Products?.Sum(p => p.Teams?.Count ?? 0) ?? 0,
            CreatedAt = o.CreatedAt,
            LastActivityAt = o.UpdatedAt 
        }).OrderByDescending(o => o.CreatedAt);
    }

    public async Task<AdminOrganizationDetailDto?> GetOrganizationDetailsAsync(int orgId)
    {
        var org = await _db.Organizations
            .Include(o => o.Members)
                .ThenInclude(m => m.User)
            .Include(o => o.Products)
                .ThenInclude(p => p.Teams)
            .FirstOrDefaultAsync(o => o.Id == orgId);

        if (org == null) return null;

        return new AdminOrganizationDetailDto
        {
            Id = org.Id,
            Name = org.Name,
            Slug = org.Slug,
            CreatedAt = org.CreatedAt,
            Members = org.Members.Select(m => new AdminOrgMemberDto
            {
                Id = m.Id,
                UserId = m.UserId,
                Email = m.User?.Email ?? "Unknown", 
                Role = m.Role.ToString(),
                Status = m.Status.ToString()
            }).ToList(),
            Products = org.Products.Select(p => new AdminOrgProductDto
            {
                Id = p.Id,
                Name = p.Name,
                TeamCount = p.Teams.Count,
                Teams = p.Teams.Select(t => new AdminOrgTeamDto
                {
                    Id = t.Id,
                    Name = t.Name
                }).ToList()
            }).ToList()
        };
    }

    public async Task DeleteOrganizationAsync(int orgId)
    {
        var org = await _db.Organizations.FindAsync(orgId);
        
        if (org == null)
            throw new KeyNotFoundException($"Organization {orgId} not found.");

        _db.Organizations.Remove(org);
        await _db.SaveChangesAsync();
    }
}