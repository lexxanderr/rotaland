using Microsoft.EntityFrameworkCore;
using RotaLand.Api.Data;
using RotaLand.Api.Domain.Scheduling;
using RotaLand.Api.Services.Scheduling;

namespace RotaLand.Api.Endpoints.Shifts;

public record UpdateShiftRequest(
    DateTime StartUtc,
    DateTime EndUtc,
    int BreakMinutes
);

public static class UpdateShiftEndpoint
{
    public static void MapUpdateShiftEndpoint(this WebApplication app)
    {
        app.MapPut("/api/shifts/{shiftId:guid}", async (
            Guid shiftId,
            UpdateShiftRequest request,
            RotaLandDbContext db,
            SchedulingService schedulingService) =>
        {
            var shift = await db.Shifts.FindAsync(shiftId);

            if (shift is null)
            {
                return Results.NotFound(new
                {
                    message = "Shift not found."
                });
            }

            var currentWeekStart = RotaWeek.GetMonday(shift.StartUtc);

            var publishedRota = await db.RotaPublications
                .AnyAsync(r =>
                    r.WeekStartUtc == currentWeekStart &&
                    r.Status == "Published");

            if (publishedRota)
            {
                return Results.Conflict(new
                {
                    message = "This rota is published. Amend it before editing shifts."
                });
            }

            var updatedShift = new Shift
            {
                Id = shift.Id,
                EmployeeId = shift.EmployeeId,
                Employee = shift.Employee,
                StartUtc = request.StartUtc,
                EndUtc = request.EndUtc,
                BreakMinutes = request.BreakMinutes
            };

            if (!updatedShift.HasValidTimeRange())
            {
                return Results.BadRequest(new
                {
                    message = "Shift end time must be after start time."
                });
            }

            if (!updatedShift.HasValidBreak())
            {
                return Results.BadRequest(new
                {
                    message = "Break duration is invalid."
                });
            }

            var existingShifts = await db.Shifts
                .Where(s =>
                    s.EmployeeId == shift.EmployeeId &&
                    s.Id != shift.Id)
                .ToListAsync();

            if (schedulingService.HasOverlap(updatedShift, existingShifts))
            {
                return Results.Conflict(new
                {
                    message = "Employee already has an overlapping shift."
                });
            }

            shift.StartUtc = request.StartUtc;
            shift.EndUtc = request.EndUtc;
            shift.BreakMinutes = request.BreakMinutes;

            await db.SaveChangesAsync();

            return Results.Ok(new
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
