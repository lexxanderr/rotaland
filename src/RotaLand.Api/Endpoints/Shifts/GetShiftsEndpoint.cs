using Microsoft.EntityFrameworkCore;
using RotaLand.Api.Data;

namespace RotaLand.Api.Endpoints.Shifts;

public static class GetShiftsEndpoint
{
    public static void MapGetShiftsEndpoint(this WebApplication app)
    {
        app.MapGet("/api/shifts", async (RotaLandDbContext db) =>
        {
            var shifts = await db.Shifts
                .AsNoTracking()
                .Include(s => s.Employee)
                .OrderBy(s => s.StartUtc)
                .Select(s => new
                {
                    s.Id,
                    s.EmployeeId,
                    EmployeeName = s.Employee.FirstName + " " + s.Employee.LastName,
                    s.StartUtc,
                    s.EndUtc,
                    s.BreakMinutes,
                    PaidHours = ((decimal)(s.EndUtc - s.StartUtc).TotalMinutes - s.BreakMinutes) / 60
                })
                .ToListAsync();

            return Results.Ok(shifts);
        });
    }
}
