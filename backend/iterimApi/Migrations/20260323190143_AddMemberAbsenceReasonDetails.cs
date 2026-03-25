using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace iterimApi.Migrations
{
    /// <inheritdoc />
    public partial class AddMemberAbsenceReasonDetails : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ReasonDetails",
                table: "MemberAbsences",
                type: "varchar(500)",
                maxLength: 500,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ReasonDetails",
                table: "MemberAbsences");
        }
    }
}
