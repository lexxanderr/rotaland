using RotaLand.Api.Data;

namespace RotaLand.Api.Endpoints.Employees;

public static class DeleteEmployeeEndpoint
{
    public static void MapDeleteEmployeeEndpoint(this WebApplication app)
    {
        app.MapDelete("/api/employees/{employeeId:guid}", async (
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

            employee.IsActive = false;
            await db.SaveChangesAsync();

            return Results.NoContent();
        });
    }
}
