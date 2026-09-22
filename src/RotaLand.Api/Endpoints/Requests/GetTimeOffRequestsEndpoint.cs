using Microsoft.EntityFrameworkCore;
using RotaLand.Api.Data;

namespace RotaLand.Api.Endpoints.Requests;

public static class GetTimeOffRequestsEndpoint
{
    public static void MapGetTimeOffRequestsEndpoint(this WebApplication app)
    {
        app.MapGet("/api/requests/time-off", async (RotaLandDbContext db) =>
        {
            var requests = await db.TimeOffRequests
                .AsNoTracking()
                .Include(r => r.Employee)
                .OrderByDescending(r => r.CreatedAtUtc)
                .Select(r => new
                {
                    r.Id,
                    r.EmployeeId,
                    EmployeeName = r.Employee.FirstName + " " + r.Employee.LastName,
                    r.StartDate,
                    r.EndDate,
                    r.Reason,
                    r.Status,
                    r.CreatedAtUtc,
                    r.ReviewedAtUtc
                })
                .ToListAsync();

            return Results.Ok(requests);
        });
    }
}
