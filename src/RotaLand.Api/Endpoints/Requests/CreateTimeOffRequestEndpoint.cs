using RotaLand.Api.Data;
using RotaLand.Api.Domain.Requests;

namespace RotaLand.Api.Endpoints.Requests;

public static class CreateTimeOffRequestEndpoint
{
    public static void MapCreateTimeOffRequestEndpoint(this WebApplication app)
    {
        app.MapPost("/api/requests/time-off", async (
            CreateTimeOffRequest request,
            RotaLandDbContext db) =>
        {
            var employee = await db.Employees.FindAsync(request.EmployeeId);

            if (employee is null)
            {
                return Results.NotFound(new
                {
                    message = "Employee not found."
                });
            }

            if (!employee.IsActive)
            {
                return Results.BadRequest(new
                {
                    message = "Inactive employees cannot submit time-off requests."
                });
            }

            if (request.EndDate < request.StartDate)
            {
                return Results.BadRequest(new
                {
                    message = "End date cannot be before start date."
                });
            }

            var timeOffRequest = new TimeOffRequest
            {
                EmployeeId = employee.Id,
                Employee = employee,
                StartDate = request.StartDate,
                EndDate = request.EndDate,
                Reason = request.Reason.Trim(),
                Status = "Pending"
            };

            db.TimeOffRequests.Add(timeOffRequest);
            await db.SaveChangesAsync();

            return Results.Created(
                $"/api/requests/time-off/{timeOffRequest.Id}",
                new
                {
                    timeOffRequest.Id,
                    timeOffRequest.EmployeeId,
                    EmployeeName = $"{employee.FirstName} {employee.LastName}",
                    timeOffRequest.StartDate,
                    timeOffRequest.EndDate,
                    timeOffRequest.Reason,
                    timeOffRequest.Status,
                    timeOffRequest.CreatedAtUtc
                });
        });
    }
}
