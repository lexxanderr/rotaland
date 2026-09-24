using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RotaLand.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddRotaPublicationVersioning : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "LastUpdatedAtUtc",
                table: "RotaPublications",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Version",
                table: "RotaPublications",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "LastUpdatedAtUtc",
                table: "RotaPublications");

            migrationBuilder.DropColumn(
                name: "Version",
                table: "RotaPublications");
        }
    }
}
