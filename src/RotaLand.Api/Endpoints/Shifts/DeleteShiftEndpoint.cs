using Microsoft.EntityFrameworkCore;
using RotaLand.Api.Data;
using RotaLand.Api.Services.Scheduling;

namespace RotaLand.Api.Endpoints.Shifts;

public static class DeleteShiftEndpoint
{
    public static void MapDeleteShiftEndpoint(this WebApplication app)
    {
        app.MapDelete("/api/shifts/{shiftId:guid}", async (
            Guid shiftId,
            RotaLandDbContext db) =>
        {
            var shift = await db.Shifts.FindAsync(shiftId);

            if (shift is null)
            {
                return Results.NotFound(new
                {
                    message = "Shift not found."
                });
            }

            var weekStart = RotaWeek.GetMonday(shift.StartUtc);

            var publishedRota = await db.RotaPublications
                .AnyAsync(r =>
                    r.WeekStartUtc == weekStart &&
                    r.Status == "Published");

            if (publishedRota)
            {
                return Results.Conflict(new
                {
                    message = "This rota is published. Amend it before deleting shifts."
                });
            }

            db.Shifts.Remove(shift);
            await db.SaveChangesAsync();

            return Results.NoContent();
        });
    }
}
