using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace iterimApi.Migrations
{
    /// <inheritdoc />
    public partial class RestrictThemeToLightDark : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("UPDATE `Users` SET `Theme` = 'light' WHERE LOWER(`Theme`) NOT IN ('light', 'dark') OR `Theme` IS NULL;");

            migrationBuilder.AlterColumn<string>(
                name: "Theme",
                table: "Users",
                type: "varchar(16)",
                maxLength: 16,
                nullable: false,
                defaultValue: "light",
                oldClrType: typeof(string),
                oldType: "varchar(16)",
                oldMaxLength: 16,
                oldDefaultValue: "system")
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "Theme",
                table: "Users",
                type: "varchar(16)",
                maxLength: 16,
                nullable: false,
                defaultValue: "system",
                oldClrType: typeof(string),
                oldType: "varchar(16)",
                oldMaxLength: 16,
                oldDefaultValue: "light")
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");
        }
    }
}
