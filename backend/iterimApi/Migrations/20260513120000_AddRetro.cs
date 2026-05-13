using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace iterimApi.Migrations
{
    /// <inheritdoc />
    public partial class AddRetro : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "RetroItems",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    IterationId = table.Column<int>(type: "int", nullable: false),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    Column = table.Column<string>(type: "varchar(32)", maxLength: 32, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Content = table.Column<string>(type: "varchar(2000)", maxLength: 2000, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RetroItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RetroItems_Iterations_IterationId",
                        column: x => x.IterationId,
                        principalTable: "Iterations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_RetroItems_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "RetroVotes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    RetroItemId = table.Column<int>(type: "int", nullable: false),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RetroVotes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RetroVotes_RetroItems_RetroItemId",
                        column: x => x.RetroItemId,
                        principalTable: "RetroItems",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_RetroVotes_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_RetroItems_IterationId",
                table: "RetroItems",
                column: "IterationId");

            migrationBuilder.CreateIndex(
                name: "IX_RetroItems_IterationId_Column",
                table: "RetroItems",
                columns: new[] { "IterationId", "Column" });

            migrationBuilder.CreateIndex(
                name: "IX_RetroItems_UserId",
                table: "RetroItems",
                column: "UserId");

            // Unique (RetroItemId, UserId) — enforces "one vote per user per card"
            // at the DB level; the toggle endpoint relies on it.
            migrationBuilder.CreateIndex(
                name: "IX_RetroVotes_RetroItemId_UserId",
                table: "RetroVotes",
                columns: new[] { "RetroItemId", "UserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_RetroVotes_UserId",
                table: "RetroVotes",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "RetroVotes");

            migrationBuilder.DropTable(
                name: "RetroItems");
        }
    }
}
