using RotaLand.Api.Data;

namespace RotaLand.Api.Endpoints.Employees;

public record UpdateEmployeeRequest(
    string FirstName,
    string LastName,
    string Email,
    string Role,
    decimal ContractedHoursPerWeek,
    Guid DepartmentId
);

public static class UpdateEmployeeEndpoint
{
    public static void MapUpdateEmployeeEndpoint(this WebApplication app)
    {
        app.MapPut("/api/employees/{employeeId:guid}", async (
            Guid employeeId,
            UpdateEmployeeRequest request,
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

            var department = await db.Departments.FindAsync(request.DepartmentId);

            if (department is null)
            {
                return Results.NotFound(new
                {
                    message = "Department not found."
                });
            }

            employee.FirstName = request.FirstName;
            employee.LastName = request.LastName;
            employee.Email = request.Email;
            employee.Role = request.Role;
            employee.ContractedHoursPerWeek = request.ContractedHoursPerWeek;
            employee.DepartmentId = department.Id;

            await db.SaveChangesAsync();

            return Results.Ok(new
            {
                employee.Id,
                employee.FirstName,
                employee.LastName,
                employee.Email,
                employee.Role,
                employee.ContractedHoursPerWeek,
                employee.DepartmentId,
                employee.IsActive
            });
        });
    }
}
