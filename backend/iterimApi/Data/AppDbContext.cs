using iterimApi.Models.Entities;
using iterimApi.Models.Enums;
using Microsoft.EntityFrameworkCore;

namespace iterimApi.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<Organization> Organizations => Set<Organization>();
    public DbSet<OrganizationMember> OrganizationMembers => Set<OrganizationMember>();
    public DbSet<OrganizationConfig> OrganizationConfigs => Set<OrganizationConfig>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<Team> Teams => Set<Team>();
    public DbSet<TeamMember> TeamMembers => Set<TeamMember>();
    public DbSet<Iteration> Iterations => Set<Iteration>();
    public DbSet<WorkItem> WorkItems => Set<WorkItem>();
    public DbSet<WorkItemComment> WorkItemComments => Set<WorkItemComment>();
    public DbSet<WorkItemHistory> WorkItemHistories => Set<WorkItemHistory>();
    public DbSet<MemberAbsence> MemberAbsences => Set<MemberAbsence>();
    public DbSet<RecentPage> RecentPages => Set<RecentPage>();
    public DbSet<PinnedTeam> PinnedTeams => Set<PinnedTeam>();
    public DbSet<Tag> Tags => Set<Tag>();
    public DbSet<WorkItemTag> WorkItemTags => Set<WorkItemTag>();
    public DbSet<TeamMemberTag> TeamMemberTags => Set<TeamMemberTag>();
    public DbSet<WorkItemDependency> WorkItemDependencies => Set<WorkItemDependency>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // ── Store enums as strings ──────────────────────────
        modelBuilder.Entity<User>()
            .Property(u => u.Role)
            .HasConversion<string>();

        modelBuilder.Entity<OrganizationMember>()
            .Property(om => om.Role)
            .HasConversion<string>();

        modelBuilder.Entity<OrganizationMember>()
            .Property(om => om.Status)
            .HasConversion<string>();

        modelBuilder.Entity<TeamMember>()
            .Property(tm => tm.Role)
            .HasConversion<string>();

        modelBuilder.Entity<Iteration>()
            .Property(i => i.Status)
            .HasConversion<string>();

        modelBuilder.Entity<WorkItem>()
            .Property(wi => wi.Type)
            .HasConversion<string>();

        modelBuilder.Entity<WorkItem>()
            .Property(wi => wi.Status)
            .HasConversion<string>();

        modelBuilder.Entity<WorkItem>()
            .Property(wi => wi.Priority)
            .HasConversion<string>();

        modelBuilder.Entity<MemberAbsence>()
            .Property(ma => ma.Reason)
            .HasConversion<string>();

        modelBuilder.Entity<MemberAbsence>()
            .Property(ma => ma.ReasonDetails)
            .HasMaxLength(500);

        // ── User ────────────────────────────────────────────
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasIndex(u => u.Email).IsUnique();

            entity.Property(u => u.Theme)
                .HasMaxLength(16)
                .HasDefaultValue("light");
        });

        // ── RefreshToken ────────────────────────────────────
        modelBuilder.Entity<RefreshToken>(entity =>
        {
            entity.HasIndex(rt => rt.Token).IsUnique();
            entity.HasIndex(rt => rt.UserId);

            entity.HasOne(rt => rt.User)
                .WithMany(u => u.RefreshTokens)
                .HasForeignKey(rt => rt.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ── PinnedTeam ──────────────────────────────────────
        modelBuilder.Entity<PinnedTeam>(entity =>
        {
            entity.HasKey(pt => new { pt.UserId, pt.TeamId });

            entity.HasOne(pt => pt.User)
                .WithMany(u => u.PinnedTeams)
                .HasForeignKey(pt => pt.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(pt => pt.Team)
                .WithMany()
                .HasForeignKey(pt => pt.TeamId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ── Organization ────────────────────────────────────
        modelBuilder.Entity<Organization>(entity =>
        {
            entity.HasIndex(o => o.Slug).IsUnique();

            entity.HasOne(o => o.CreatedByUser)
                .WithMany()
                .HasForeignKey(o => o.CreatedBy)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(o => o.UpdatedByUser)
                .WithMany()
                .HasForeignKey(o => o.UpdatedBy)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // ── OrganizationMember ──────────────────────────────
        modelBuilder.Entity<OrganizationMember>(entity =>
        {
            entity.HasIndex(om => new { om.OrganizationId, om.UserId }).IsUnique();
            entity.HasIndex(om => om.OrganizationId);
            entity.HasIndex(om => om.UserId);

            entity.HasOne(om => om.Organization)
                .WithMany(o => o.Members)
                .HasForeignKey(om => om.OrganizationId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(om => om.User)
                .WithMany(u => u.OrganizationMemberships)
                .HasForeignKey(om => om.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(om => om.InvitedByUser)
                .WithMany()
                .HasForeignKey(om => om.InvitedBy)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(om => om.UpdatedByUser)
                .WithMany()
                .HasForeignKey(om => om.UpdatedByUserId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // ── OrganizationConfig ──────────────────────────────
        modelBuilder.Entity<OrganizationConfig>(entity =>
        {
            entity.HasIndex(oc => oc.OrganizationId).IsUnique();

            entity.HasOne(oc => oc.Organization)
                .WithOne(o => o.Config)
                .HasForeignKey<OrganizationConfig>(oc => oc.OrganizationId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ── Product ─────────────────────────────────────────
        modelBuilder.Entity<Product>(entity =>
        {
            entity.HasOne(p => p.Organization)
                .WithMany(o => o.Products)
                .HasForeignKey(p => p.OrganizationId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(p => p.CreatedByUser)
                .WithMany()
                .HasForeignKey(p => p.CreatedBy)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(p => p.UpdatedByUser)
                .WithMany()
                .HasForeignKey(p => p.UpdatedBy)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // ── Team ────────────────────────────────────────────
        modelBuilder.Entity<Team>(entity =>
        {
            entity.HasIndex(t => t.ProductId);

            entity.HasOne(t => t.Product)
                .WithMany(p => p.Teams)
                .HasForeignKey(t => t.ProductId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(t => t.CreatedByUser)
                .WithMany()
                .HasForeignKey(t => t.CreatedBy)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(t => t.UpdatedByUser)
                .WithMany()
                .HasForeignKey(t => t.UpdatedBy)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // ── TeamMember ──────────────────────────────────────
        modelBuilder.Entity<TeamMember>(entity =>
        {
            entity.HasIndex(tm => new { tm.TeamId, tm.OrgMemberId }).IsUnique();
            entity.HasIndex(tm => tm.TeamId);
            entity.HasIndex(tm => tm.OrgMemberId);

            entity.HasOne(tm => tm.Team)
                .WithMany(t => t.Members)
                .HasForeignKey(tm => tm.TeamId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(tm => tm.OrgMember)
                .WithMany(om => om.TeamMemberships)
                .HasForeignKey(tm => tm.OrgMemberId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(tm => tm.CreatedByUser)
                .WithMany()
                .HasForeignKey(tm => tm.CreatedBy)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(tm => tm.UpdatedByUser)
                .WithMany()
                .HasForeignKey(tm => tm.UpdatedBy)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // ── Iteration ───────────────────────────────────────
        modelBuilder.Entity<Iteration>(entity =>
        {
            entity.HasIndex(i => i.TeamId);

            entity.HasOne(i => i.Team)
                .WithMany(t => t.Iterations)
                .HasForeignKey(i => i.TeamId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(i => i.CreatedByUser)
                .WithMany()
                .HasForeignKey(i => i.CreatedBy)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(i => i.UpdatedByUser)
                .WithMany()
                .HasForeignKey(i => i.UpdatedBy)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // ── WorkItem ────────────────────────────────────────
        modelBuilder.Entity<WorkItem>(entity =>
        {
            entity.HasIndex(wi => wi.TeamId);
            entity.HasIndex(wi => wi.IterationId);
            entity.HasIndex(wi => wi.AssignedTo);
            entity.HasIndex(wi => wi.Status);

            entity.HasOne(wi => wi.Team)
                .WithMany(t => t.WorkItems)
                .HasForeignKey(wi => wi.TeamId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(wi => wi.Iteration)
                .WithMany(i => i.WorkItems)
                .HasForeignKey(wi => wi.IterationId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(wi => wi.AssignedMember)
                .WithMany(tm => tm.AssignedWorkItems)
                .HasForeignKey(wi => wi.AssignedTo)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(wi => wi.CreatedByUser)
                .WithMany()
                .HasForeignKey(wi => wi.CreatedBy)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(wi => wi.UpdatedByUser)
                .WithMany()
                .HasForeignKey(wi => wi.UpdatedBy)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // ── WorkItemComment ─────────────────────────────────
        modelBuilder.Entity<WorkItemComment>(entity =>
        {
            entity.HasIndex(wic => wic.WorkItemId);

            entity.HasOne(wic => wic.WorkItem)
                .WithMany(wi => wi.Comments)
                .HasForeignKey(wic => wic.WorkItemId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(wic => wic.Author)
                .WithMany(om => om.Comments)
                .HasForeignKey(wic => wic.AuthorId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(wic => wic.ParentComment)
                .WithMany(wic => wic.Replies)
                .HasForeignKey(wic => wic.ParentCommentId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // ── WorkItemHistory ─────────────────────────────────
        modelBuilder.Entity<WorkItemHistory>(entity =>
        {
            entity.HasIndex(wih => wih.WorkItemId);
            entity.HasIndex(wih => wih.ChangedAt);

            entity.HasOne(wih => wih.WorkItem)
                .WithMany(wi => wi.History)
                .HasForeignKey(wih => wih.WorkItemId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(wih => wih.ChangedByMember)
                .WithMany(om => om.HistoryChanges)
                .HasForeignKey(wih => wih.ChangedBy)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // ── MemberAbsence ───────────────────────────────────
        modelBuilder.Entity<MemberAbsence>(entity =>
        {
            entity.HasOne(ma => ma.OrgMember)
                .WithMany(om => om.Absences)
                .HasForeignKey(ma => ma.OrgMemberId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(ma => ma.CreatedByUser)
                .WithMany()
                .HasForeignKey(ma => ma.CreatedBy)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(ma => ma.UpdatedByUser)
                .WithMany()
                .HasForeignKey(ma => ma.UpdatedBy)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // ── Tag ─────────────────────────────────────────────
        modelBuilder.Entity<Tag>(entity =>
        {
            entity.HasIndex(t => t.OrganizationId);
            entity.HasIndex(t => new { t.OrganizationId, t.Name }).IsUnique();

            entity.Property(t => t.Name).HasMaxLength(100);
            entity.Property(t => t.Color).HasMaxLength(20);

            entity.HasOne(t => t.Organization)
                .WithMany(o => o.Tags)
                .HasForeignKey(t => t.OrganizationId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ── WorkItemTag ──────────────────────────────────────
        modelBuilder.Entity<WorkItemTag>(entity =>
        {
            entity.HasKey(wit => new { wit.WorkItemId, wit.TagId });

            entity.HasOne(wit => wit.WorkItem)
                .WithMany(wi => wi.Tags)
                .HasForeignKey(wit => wit.WorkItemId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(wit => wit.Tag)
                .WithMany(t => t.WorkItemTags)
                .HasForeignKey(wit => wit.TagId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ── TeamMemberTag ────────────────────────────────────
        modelBuilder.Entity<TeamMemberTag>(entity =>
        {
            entity.HasKey(tmt => new { tmt.TeamMemberId, tmt.TagId });

            entity.HasOne(tmt => tmt.TeamMember)
                .WithMany(tm => tm.Tags)
                .HasForeignKey(tmt => tmt.TeamMemberId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(tmt => tmt.Tag)
                .WithMany(t => t.TeamMemberTags)
                .HasForeignKey(tmt => tmt.TagId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ── WorkItemDependency ───────────────────────────────
        modelBuilder.Entity<WorkItemDependency>(entity =>
        {
            entity.HasIndex(d => new { d.BlockerWorkItemId, d.BlockedWorkItemId }).IsUnique();
            entity.HasIndex(d => d.BlockerWorkItemId);
            entity.HasIndex(d => d.BlockedWorkItemId);

            entity.HasOne(d => d.BlockerWorkItem)
                .WithMany(wi => wi.Blocks)
                .HasForeignKey(d => d.BlockerWorkItemId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(d => d.BlockedWorkItem)
                .WithMany(wi => wi.BlockedBy)
                .HasForeignKey(d => d.BlockedWorkItemId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(d => d.CreatedByMember)
                .WithMany()
                .HasForeignKey(d => d.CreatedBy)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }
}