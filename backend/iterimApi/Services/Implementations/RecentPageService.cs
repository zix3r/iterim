using iterimApi.Data;
using iterimApi.DTOs.Users;
using iterimApi.Models.Entities;
using iterimApi.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace iterimApi.Services.Implementations;

public class RecentPageService : IRecentPageService
{
    private readonly AppDbContext _context;

    public RecentPageService(AppDbContext context)
    {
        _context = context;
    }

    public async Task AddRecentPageAsync(int userId, RecentPageDto dto)
    {
        var existing = await _context.RecentPages
            .Where(rp => rp.UserId == userId && rp.Path == dto.Path)
            .FirstOrDefaultAsync();

        if (existing != null)
        {
            existing.AccessedAt = DateTime.UtcNow;
            existing.Label = dto.Label;
            existing.IconType = dto.IconType;
        }
        else
        {
            var newPage = new RecentPage
            {
                UserId = userId,
                Path = dto.Path,
                Label = dto.Label,
                IconType = dto.IconType,
                AccessedAt = DateTime.UtcNow
            };
            _context.RecentPages.Add(newPage);
        }

        await _context.SaveChangesAsync();

        var count = await _context.RecentPages.CountAsync(rp => rp.UserId == userId);
        if (count > 5)
        {
            var oldest = await _context.RecentPages
                .Where(rp => rp.UserId == userId)
                .OrderBy(rp => rp.AccessedAt)
                .Take(count - 5)
                .ToListAsync();

            if (oldest.Any())
            {
                _context.RecentPages.RemoveRange(oldest);
                await _context.SaveChangesAsync();
            }
        }
    }

    public async Task<List<RecentPageDto>> GetRecentPagesAsync(int userId)
    {
        var pages = await _context.RecentPages
            .AsNoTracking()
            .Where(rp => rp.UserId == userId)
            .OrderByDescending(rp => rp.AccessedAt)
            .Select(rp => new RecentPageDto
            {
                Path = rp.Path,
                Label = rp.Label,
                IconType = rp.IconType,
                AccessedAt = rp.AccessedAt
            })
            .ToListAsync();

        return pages;
    }

    public async Task ClearRecentPagesAsync(int userId)
    {
        var pages = await _context.RecentPages
            .Where(rp => rp.UserId == userId)
            .ToListAsync();

        if (pages.Any())
        {
            _context.RecentPages.RemoveRange(pages);
            await _context.SaveChangesAsync();
        }
    }
}