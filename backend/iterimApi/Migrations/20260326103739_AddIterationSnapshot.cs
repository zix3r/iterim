using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace iterimApi.Migrations
{
    /// <inheritdoc />
    public partial class AddIterationSnapshot : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "SnapshotCompletedPoints",
                table: "Iterations",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "SnapshotPlannedPoints",
                table: "Iterations",
                type: "int",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SnapshotCompletedPoints",
                table: "Iterations");

            migrationBuilder.DropColumn(
                name: "SnapshotPlannedPoints",
                table: "Iterations");
        }
    }
}
