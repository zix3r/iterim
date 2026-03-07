using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using iterimApi.Data; // Pakeiskite į savo DbContext namespace
using iterimApi.Models.DTOs.Organizations;
using iterimApi.Services.Interfaces;
using iterimApi.Models.Entities;
using iterimApi.Models.Enums;

namespace iterimApi.Services.Implementations;

public class OrganizationService : IOrganizationService
{
    private readonly AppDbContext _context; // Pakeiskite į savo konteksto pavadinimą

    public OrganizationService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<OrganizationDto>> GetUserOrganizationsAsync(int userId)
    {
        return await _context.Organizations
            .Where(o => o.Members.Any(m => m.UserId == userId))
            .Select(o => new OrganizationDto
            {
                Id = o.Id,
                Name = o.Name,
                Slug = o.Slug
            })
            .ToListAsync();
    }

    public async Task<OrganizationDetailDto> GetOrganizationByIdAsync(int id, int userId)
    {
        var organization = await _context.Organizations
            .Include(o => o.Members)
            .ThenInclude(m => m.User)
            .FirstOrDefaultAsync(o => o.Id == id);

        if (organization == null)
            throw new KeyNotFoundException("Organization not found.");

        var currentUserMember = organization.Members.FirstOrDefault(m => m.UserId == userId);
        if (currentUserMember == null)
            throw new UnauthorizedAccessException("You do not have permission to view this organization.");

        return new OrganizationDetailDto
        {
            Id = organization.Id,
            Name = organization.Name,
            Slug = organization.Slug,
            UserRole = currentUserMember.Role.ToString(),
            Members = organization.Members.Select(m => new OrganizationMemberDto
            {
                UserId = m.UserId,
                Email = m.Email,
                Role = m.Role.ToString(),
                Status = m.Status.ToString()
            }).ToList()
        };
    }

    public async Task<OrganizationDto> CreateOrganizationAsync(CreateOrganizationDto dto, int userId)
    {
        // Paimame vartotoją, kad gautume jo el. paštą organizacijos narių lentelei
        var user = await _context.Users.FindAsync(userId);
        if (user == null) throw new UnauthorizedAccessException("User not found.");

        var slug = GenerateSlug(dto.Name);

        if (await _context.Organizations.AnyAsync(o => o.Slug == slug))
        {
            slug = $"{slug}-{Guid.NewGuid().ToString().Substring(0, 5)}";
        }

        var organization = new Organization
        {
            Name = dto.Name,
            Slug = slug,
            CreatedBy = userId,
            UpdatedBy = userId,
            Members = new List<OrganizationMember>
            {
                new OrganizationMember
                {
                    UserId = userId,
                    Email = user.Email, // Paimame el. paštą iš User
                    Role = OrgMemberRole.Admin, // Darant prielaidą, kad toks Enum egzistuoja
                    Status = OrgMemberStatus.Active, // Darant prielaidą, kad toks Enum egzistuoja
                    JoinedAt = DateTime.UtcNow
                }
            }
        };

        _context.Organizations.Add(organization);
        await _context.SaveChangesAsync();

        return new OrganizationDto
        {
            Id = organization.Id,
            Name = organization.Name,
            Slug = organization.Slug
        };
    }

    private string GenerateSlug(string phrase)
    {
        string str = phrase.ToLowerInvariant();
        str = Regex.Replace(str, @"[^a-z0-9\s-]", ""); 
        str = Regex.Replace(str, @"\s+", " ").Trim();
        str = Regex.Replace(str, @"\s", "-"); 
        return str;
    }
}