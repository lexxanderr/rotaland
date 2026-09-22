using RotaLand.Api.Data;
using RotaLand.Api.Domain.Employees;

namespace RotaLand.Api.Endpoints.Employees;

public static class CreateEmployeeEndpoint
{
    public static void MapCreateEmployeeEndpoint(this WebApplication app)
    {
        app.MapPost("/api/employees", async (
            CreateEmployeeRequest request,
            RotaLandDbContext db) =>
        {
            var department = await db.Departments.FindAsync(request.DepartmentId);

            if (department is null)
            {
                return Results.NotFound(new
                {
                    message = "Department not found."
                });
            }

            var employee = new Employee
            {
                FirstName = request.FirstName,
                LastName = request.LastName,
                Email = request.Email,
                Role = request.Role,
                ContractedHoursPerWeek = request.ContractedHoursPerWeek,
                DepartmentId = department.Id,
                Department = department
            };

            db.Employees.Add(employee);
            await db.SaveChangesAsync();

            return Results.Created($"/api/employees/{employee.Id}", new
            {
                employee.Id,
                employee.FirstName,
                employee.LastName,
                employee.Email,
                employee.Role,
                employee.ContractedHoursPerWeek,
                employee.DepartmentId
            });
        });
    }
}
