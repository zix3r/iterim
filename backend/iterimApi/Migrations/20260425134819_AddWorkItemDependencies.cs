using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace iterimApi.Migrations
{
    /// <inheritdoc />
    public partial class AddWorkItemDependencies : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "WorkItemDependencies",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    BlockerWorkItemId = table.Column<int>(type: "int", nullable: false),
                    BlockedWorkItemId = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    CreatedBy = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WorkItemDependencies", x => x.Id);
                    table.ForeignKey(
                        name: "FK_WorkItemDependencies_OrganizationMembers_CreatedBy",
                        column: x => x.CreatedBy,
                        principalTable: "OrganizationMembers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_WorkItemDependencies_WorkItems_BlockedWorkItemId",
                        column: x => x.BlockedWorkItemId,
                        principalTable: "WorkItems",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_WorkItemDependencies_WorkItems_BlockerWorkItemId",
                        column: x => x.BlockerWorkItemId,
                        principalTable: "WorkItems",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_WorkItemDependencies_BlockedWorkItemId",
                table: "WorkItemDependencies",
                column: "BlockedWorkItemId");

            migrationBuilder.CreateIndex(
                name: "IX_WorkItemDependencies_BlockerWorkItemId",
                table: "WorkItemDependencies",
                column: "BlockerWorkItemId");

            migrationBuilder.CreateIndex(
                name: "IX_WorkItemDependencies_BlockerWorkItemId_BlockedWorkItemId",
                table: "WorkItemDependencies",
                columns: new[] { "BlockerWorkItemId", "BlockedWorkItemId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_WorkItemDependencies_CreatedBy",
                table: "WorkItemDependencies",
                column: "CreatedBy");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "WorkItemDependencies");
        }
    }
}
