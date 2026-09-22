using RotaLand.Api.Data;

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

            db.Shifts.Remove(shift);
            await db.SaveChangesAsync();

            return Results.NoContent();
        });
    }
}
