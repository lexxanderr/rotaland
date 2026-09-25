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

            var weekStart = RotaWeek.GetMonday(shift.StartUtc);
            var weekEnd = weekStart.AddDays(7);

            var publishedRota = await db.RotaPublications
                .AnyAsync(r =>
                    r.WeekStartUtc == weekStart &&
                    r.Status == "Published");

            if (publishedRota)
            {
                return Results.Conflict(new
                {
                    code = "ROTA_PUBLISHED",
                    message = "This rota is published. Amend it before adding shifts."
                });
            }

            var existingShifts = await db.Shifts
                .Where(s => s.EmployeeId == employee.Id)
                .ToListAsync();

            if (schedulingService.HasOverlap(shift, existingShifts))
            {
                return Results.Conflict(new
                {
                    code = "SHIFT_OVERLAP",
                    message = "Employee already has an overlapping shift."
                });
            }

            var shiftDate = DateOnly.FromDateTime(shift.StartUtc);

            var approvedLeave = await db.TimeOffRequests
                .Where(r =>
                    r.EmployeeId == employee.Id &&
                    r.Status == "Approved" &&
                    r.StartDate <= shiftDate &&
                    r.EndDate >= shiftDate)
                .FirstOrDefaultAsync();

            if (approvedLeave is not null)
            {
                return Results.Conflict(new
                {
                    code = "APPROVED_LEAVE",
                    message = $"{employee.FirstName} {employee.LastName} has approved time off on this date.",
                    leaveStart = approvedLeave.StartDate,
                    leaveEnd = approvedLeave.EndDate
                });
            }

            var weeklyShifts = existingShifts
                .Where(s =>
                    s.StartUtc >= weekStart &&
                    s.StartUtc < weekEnd)
                .ToList();

            var currentlyScheduledHours =
                schedulingService.CalculateScheduledHours(weeklyShifts);

            var projectedHours =
                currentlyScheduledHours + shift.GetPaidHours();

            var contractedHours =
                employee.ContractedHoursPerWeek;

            var overHours = Math.Max(
                0,
                projectedHours - contractedHours);

            db.Shifts.Add(shift);
            await db.SaveChangesAsync();

            return Results.Created($"/api/shifts/{shift.Id}", new
            {
                shift.Id,
                shift.EmployeeId,
                shift.StartUtc,
                shift.EndUtc,
                shift.BreakMinutes,
                PaidHours = shift.GetPaidHours(),

                scheduling = new
                {
                    contractedHours,
                    previouslyScheduledHours = currentlyScheduledHours,
                    projectedHours,
                    overHours,
                    isOverContract = overHours > 0,
                    warning = overHours > 0
                        ? $"{employee.FirstName} {employee.LastName} is now {overHours:0.##}h over contracted hours."
                        : null
                }
            });
        });
    }
}
