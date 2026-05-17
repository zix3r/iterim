using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace iterimApi.Migrations
{
    /// <inheritdoc />
    public partial class AddRoleGrantedByUserId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // -- OrganizationMembers ---------------------------------------
            migrationBuilder.AddColumn<int>(
                name: "RoleGrantedByUserId",
                table: "OrganizationMembers",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_OrganizationMembers_RoleGrantedByUserId",
                table: "OrganizationMembers",
                column: "RoleGrantedByUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_OrganizationMembers_Users_RoleGrantedByUserId",
                table: "OrganizationMembers",
                column: "RoleGrantedByUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            // -- TeamMembers -----------------------------------------------
            migrationBuilder.AddColumn<int>(
                name: "RoleGrantedByUserId",
                table: "TeamMembers",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_TeamMembers_RoleGrantedByUserId",
                table: "TeamMembers",
                column: "RoleGrantedByUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_TeamMembers_Users_RoleGrantedByUserId",
                table: "TeamMembers",
                column: "RoleGrantedByUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            // -- Users (global Admin role) ---------------------------------
            migrationBuilder.AddColumn<int>(
                name: "RoleGrantedByUserId",
                table: "Users",
                type: "int",
                nullable: true);

            // -- Backfill OrganizationMembers ------------------------------
            // Existing admins (pre-audit) get a sensible granter: InvitedBy
            // when present, otherwise the org creator. Owner row stays NULL.
            migrationBuilder.Sql(@"
                UPDATE OrganizationMembers om
                INNER JOIN Organizations o ON o.Id = om.OrganizationId
                SET om.RoleGrantedByUserId = COALESCE(om.InvitedBy, o.CreatedBy)
                WHERE om.Role = 'Admin'
                  AND om.RoleGrantedByUserId IS NULL
                  AND om.UserId <> o.CreatedBy;
            ");

            // -- Backfill TeamMembers --------------------------------------
            migrationBuilder.Sql(@"
                UPDATE TeamMembers tm
                INNER JOIN Teams t ON t.Id = tm.TeamId
                INNER JOIN OrganizationMembers om ON om.Id = tm.OrgMemberId
                SET tm.RoleGrantedByUserId = COALESCE(tm.CreatedBy, t.CreatedBy)
                WHERE tm.Role = 'Admin'
                  AND tm.RoleGrantedByUserId IS NULL
                  AND om.UserId <> t.CreatedBy;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_OrganizationMembers_Users_RoleGrantedByUserId",
                table: "OrganizationMembers");

            migrationBuilder.DropIndex(
                name: "IX_OrganizationMembers_RoleGrantedByUserId",
                table: "OrganizationMembers");

            migrationBuilder.DropColumn(
                name: "RoleGrantedByUserId",
                table: "OrganizationMembers");

            migrationBuilder.DropForeignKey(
                name: "FK_TeamMembers_Users_RoleGrantedByUserId",
                table: "TeamMembers");

            migrationBuilder.DropIndex(
                name: "IX_TeamMembers_RoleGrantedByUserId",
                table: "TeamMembers");

            migrationBuilder.DropColumn(
                name: "RoleGrantedByUserId",
                table: "TeamMembers");

            migrationBuilder.DropColumn(
                name: "RoleGrantedByUserId",
                table: "Users");
        }
    }
}
