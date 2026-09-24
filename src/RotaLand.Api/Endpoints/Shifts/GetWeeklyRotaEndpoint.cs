using Microsoft.EntityFrameworkCore;
using RotaLand.Api.Data;
using RotaLand.Api.Services.Scheduling;

namespace RotaLand.Api.Endpoints.Shifts;

public static class GetWeeklyRotaEndpoint
{
    public static void MapGetWeeklyRotaEndpoint(this WebApplication app)
    {
        app.MapGet("/api/rota/week", async (
            DateTime start,
            RotaLandDbContext db) =>
        {
            var weekStart = RotaWeek.GetMonday(start);
            var end = weekStart.AddDays(7);

            var publication = await db.RotaPublications
                .AsNoTracking()
                .SingleOrDefaultAsync(r => r.WeekStartUtc == weekStart);

            var shifts = await db.Shifts
                .AsNoTracking()
                .Include(s => s.Employee)
                .Where(s => s.StartUtc >= weekStart && s.StartUtc < end && s.Employee.IsActive)
                .OrderBy(s => s.StartUtc)
                .ToListAsync();

            var shiftResults = shifts.Select(s => new
            {
                s.Id,
                s.EmployeeId,
                EmployeeName = $"{s.Employee.FirstName} {s.Employee.LastName}",
                s.StartUtc,
                s.EndUtc,
                s.BreakMinutes,
                PaidHours = s.GetPaidHours()
            }).ToList();

            return Results.Ok(new
            {
                WeekStart = weekStart,
                WeekEnd = end,
                Status = publication?.Status == "Published" && publication.Version > 1
                    ? "Updated"
                    : publication?.Status ?? "Draft",
                Version = publication?.Version ?? 0,
                WasPreviouslyPublished = (publication?.Version ?? 0) > 0,
                PublishedAtUtc = publication?.PublishedAtUtc,
                LastUpdatedAtUtc = publication?.LastUpdatedAtUtc,
                TotalScheduledHours = shifts.Sum(s => s.GetPaidHours()),
                Shifts = shiftResults
            });
        });
    }
}
