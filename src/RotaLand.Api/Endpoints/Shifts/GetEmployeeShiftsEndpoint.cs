using Microsoft.EntityFrameworkCore;
using RotaLand.Api.Data;

namespace RotaLand.Api.Endpoints.Shifts;

public static class GetEmployeeShiftsEndpoint
{
    public static void MapGetEmployeeShiftsEndpoint(this WebApplication app)
    {
        app.MapGet("/api/employees/{employeeId:guid}/shifts", async (
            Guid employeeId,
            RotaLandDbContext db) =>
        {
            var employeeExists = await db.Employees
                .AnyAsync(e => e.Id == employeeId);

            if (!employeeExists)
            {
                return Results.NotFound(new
                {
                    message = "Employee not found."
                });
            }

            var shifts = await db.Shifts
                .AsNoTracking()
                .Where(s => s.EmployeeId == employeeId)
                .OrderBy(s => s.StartUtc)
                .ToListAsync();

            return Results.Ok(shifts.Select(s => new
            {
                s.Id,
                s.EmployeeId,
                s.StartUtc,
                s.EndUtc,
                s.BreakMinutes,
                PaidHours = s.GetPaidHours()
            }));
        });
    }
}
