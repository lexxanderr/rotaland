using RotaLand.Api.Data;

namespace RotaLand.Api.Endpoints.Employees;

public static class ReactivateEmployeeEndpoint
{
    public static void MapReactivateEmployeeEndpoint(this WebApplication app)
    {
        app.MapPut("/api/employees/{employeeId:guid}/reactivate", async (
            Guid employeeId,
            RotaLandDbContext db) =>
        {
            var employee = await db.Employees.FindAsync(employeeId);

            if (employee is null)
            {
                return Results.NotFound(new
                {
                    message = "Employee not found."
                });
            }

            employee.IsActive = true;
            await db.SaveChangesAsync();

            return Results.NoContent();
        });
    }
}
