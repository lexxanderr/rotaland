using Microsoft.EntityFrameworkCore;
using RotaLand.Api.Data;
using RotaLand.Api.Domain.Scheduling;
using RotaLand.Api.Services.Scheduling;

namespace RotaLand.Api.Endpoints.Shifts;

public static class CreateShiftEndpoint
{
    public static void MapCreateShiftEndpoint(this WebApplication app)
    {
        app.MapPost("/api/shifts", async (
            CreateShiftRequest request,
            RotaLandDbContext db,
            SchedulingService schedulingService) =>
        {
            var employee = await db.Employees
                .FindAsync(request.EmployeeId);

            if (employee is null)
            {
                return Results.NotFound(new
                {
                    message = "Employee not found."
                });
            }

            var shift = new Shift
            {
                EmployeeId = employee.Id,
                Employee = employee,
                StartUtc = request.StartUtc,
                EndUtc = request.EndUtc,
                BreakMinutes = request.BreakMinutes
            };

            if (!shift.HasValidTimeRange())
            {
                return Results.BadRequest(new
                {
                    message = "Shift end time must be after start time."
                });
            }

            if (!shift.HasValidBreak())
            {
                return Results.BadRequest(new
                {
                    message = "Break duration is invalid."
                });
            }

            var existingShifts = await db.Shifts
                .Where(s => s.EmployeeId == employee.Id)
                .ToListAsync();

            if (schedulingService.HasOverlap(shift, existingShifts))
            {
                return Results.Conflict(new
                {
                    message = "Employee already has an overlapping shift."
                });
            }

            db.Shifts.Add(shift);
            await db.SaveChangesAsync();

            return Results.Created($"/api/shifts/{shift.Id}", new
            {
                shift.Id,
                shift.EmployeeId,
                shift.StartUtc,
                shift.EndUtc,
                shift.BreakMinutes,
                PaidHours = shift.GetPaidHours()
            });
        });
    }
}
