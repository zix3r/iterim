using iterimApi.Data;
using iterimApi.DTOs.Retro;
using iterimApi.Models.Entities;
using iterimApi.Models.Enums;
using iterimApi.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace iterimApi.Services.Implementations;

/// <summary>
/// All retro write paths run the same gauntlet:
///   1. The iteration exists and belongs to the team in the URL
///   2. The caller is a member of that team
///   3. The iteration is not Completed (writes only — reads are always allowed)
///
/// Author-only edit/delete is checked inline at the operation site.
/// </summary>
public class RetroService : IRetroService
{
    private readonly AppDbContext _db;

    public RetroService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<RetroBoardDto> GetRetroBoardAsync(int teamId, int iterationId, int userId)
    {
        var iteration = await EnsureIterationInTeam(teamId, iterationId);
        await EnsureTeamMember(teamId, userId);

        var items = await _db.RetroItems
            .Where(ri => ri.IterationId == iterationId)
            .Include(ri => ri.User)
            .Include(ri => ri.Votes)
            // Server-side ordering keeps the API stable even if the FE forgets
            // to sort. Most-voted first, then newest.
            .OrderByDescending(ri => ri.Votes.Count)
            .ThenByDescending(ri => ri.CreatedAt)
            .ToListAsync();

        return new RetroBoardDto
        {
            IterationId = iteration.Id,
            TeamId = iteration.TeamId,
            IterationName = iteration.Name,
            IterationStatus = iteration.Status.ToString(),
            IsReadOnly = iteration.Status == IterationStatus.Completed,
            Items = items.Select(ri => MapToDto(ri, userId)).ToList()
        };
    }

    public async Task<RetroItemDto> CreateRetroItemAsync(int teamId, int iterationId, CreateRetroItemDto dto, int userId)
    {
        var iteration = await EnsureIterationInTeam(teamId, iterationId);
        await EnsureTeamMember(teamId, userId);
        EnsureNotReadOnly(iteration);

        var item = new RetroItem
        {
            IterationId = iterationId,
            UserId = userId,
            Column = dto.Column,
            Content = dto.Content.Trim(),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };

        _db.RetroItems.Add(item);
        await _db.SaveChangesAsync();

        // Reload with author + (empty) votes so MapToDto has everything it needs.
        await _db.Entry(item).Reference(i => i.User).LoadAsync();
        await _db.Entry(item).Collection(i => i.Votes).LoadAsync();

        return MapToDto(item, userId);
    }

    public async Task<RetroItemDto> UpdateRetroItemAsync(int teamId, int iterationId, int itemId, UpdateRetroItemDto dto, int userId)
    {
        var iteration = await EnsureIterationInTeam(teamId, iterationId);
        await EnsureTeamMember(teamId, userId);
        EnsureNotReadOnly(iteration);

        var item = await _db.RetroItems
            .Include(ri => ri.User)
            .Include(ri => ri.Votes)
            .FirstOrDefaultAsync(ri => ri.Id == itemId && ri.IterationId == iterationId)
            ?? throw new KeyNotFoundException("Retro item not found");

        if (item.UserId != userId)
            throw new UnauthorizedAccessException("Only the author can edit this card");

        item.Content = dto.Content.Trim();
        item.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return MapToDto(item, userId);
    }

    public async Task DeleteRetroItemAsync(int teamId, int iterationId, int itemId, int userId)
    {
        var iteration = await EnsureIterationInTeam(teamId, iterationId);
        await EnsureTeamMember(teamId, userId);
        EnsureNotReadOnly(iteration);

        var item = await _db.RetroItems
            .FirstOrDefaultAsync(ri => ri.Id == itemId && ri.IterationId == iterationId)
            ?? throw new KeyNotFoundException("Retro item not found");

        if (item.UserId != userId)
            throw new UnauthorizedAccessException("Only the author can delete this card");

        // Cascade on RetroItem → RetroVote handles vote cleanup at the DB layer.
        _db.RetroItems.Remove(item);
        await _db.SaveChangesAsync();
    }

    public async Task<RetroItemDto> ToggleVoteAsync(int teamId, int iterationId, int itemId, int userId)
    {
        var iteration = await EnsureIterationInTeam(teamId, iterationId);
        await EnsureTeamMember(teamId, userId);
        EnsureNotReadOnly(iteration);

        // Load author for the DTO; do NOT load Votes here. We mutate the votes
        // table directly (without touching item.Votes) and then count fresh
        // from the DB — this avoids EF Core's relationship fix-up doubling
        // entries when we Add() through both DbSet and the navigation property.
        var item = await _db.RetroItems
            .Include(ri => ri.User)
            .FirstOrDefaultAsync(ri => ri.Id == itemId && ri.IterationId == iterationId)
            ?? throw new KeyNotFoundException("Retro item not found");

        var existingVote = await _db.RetroVotes
            .FirstOrDefaultAsync(v => v.RetroItemId == itemId && v.UserId == userId);

        if (existingVote != null)
        {
            // Toggle off: user clicked an already-voted card.
            _db.RetroVotes.Remove(existingVote);
        }
        else
        {
            _db.RetroVotes.Add(new RetroVote
            {
                RetroItemId = item.Id,
                UserId = userId,
                CreatedAt = DateTime.UtcNow,
            });
        }

        await _db.SaveChangesAsync();

        // Re-read counts from the DB so the response reflects the canonical
        // state — independent of any in-memory tracker quirks.
        var voteCount = await _db.RetroVotes.CountAsync(v => v.RetroItemId == item.Id);
        var hasVoted = await _db.RetroVotes.AnyAsync(v => v.RetroItemId == item.Id && v.UserId == userId);

        return new RetroItemDto
        {
            Id = item.Id,
            IterationId = item.IterationId,
            UserId = item.UserId,
            AuthorName = item.User?.Name ?? string.Empty,
            AuthorAvatarUrl = item.User?.AvatarUrl,
            Column = item.Column.ToString(),
            Content = item.Content,
            VoteCount = voteCount,
            HasVoted = hasVoted,
            IsOwn = item.UserId == userId,
            CreatedAt = item.CreatedAt,
            UpdatedAt = item.UpdatedAt,
        };
    }

    // ── Private helpers ──────────────────────────────────────

    /// <summary>Loads iteration and asserts it belongs to <paramref name="teamId"/> from the URL.</summary>
    private async Task<Iteration> EnsureIterationInTeam(int teamId, int iterationId)
    {
        var iteration = await _db.Iterations
            .FirstOrDefaultAsync(i => i.Id == iterationId)
            ?? throw new KeyNotFoundException("Iteration not found");

        if (iteration.TeamId != teamId)
            throw new KeyNotFoundException("Iteration not found in this team");

        return iteration;
    }

    private async Task EnsureTeamMember(int teamId, int userId)
    {
        var teamExists = await _db.Teams.AnyAsync(t => t.Id == teamId);
        if (!teamExists)
            throw new KeyNotFoundException("Team not found");

        var isMember = await _db.TeamMembers
            .AnyAsync(tm => tm.TeamId == teamId && tm.OrgMember.UserId == userId);

        if (!isMember)
            throw new UnauthorizedAccessException("User is not a member of this team");
    }

    private static void EnsureNotReadOnly(Iteration iteration)
    {
        if (iteration.Status == IterationStatus.Completed)
            throw new InvalidOperationException("Retrospective is read-only — iteration is completed");
    }

    private static RetroItemDto MapToDto(RetroItem item, int currentUserId)
    {
        return new RetroItemDto
        {
            Id = item.Id,
            IterationId = item.IterationId,
            UserId = item.UserId,
            AuthorName = item.User?.Name ?? string.Empty,
            AuthorAvatarUrl = item.User?.AvatarUrl,
            Column = item.Column.ToString(),
            Content = item.Content,
            VoteCount = item.Votes.Count,
            HasVoted = item.Votes.Any(v => v.UserId == currentUserId),
            IsOwn = item.UserId == currentUserId,
            CreatedAt = item.CreatedAt,
            UpdatedAt = item.UpdatedAt,
        };
    }
}
