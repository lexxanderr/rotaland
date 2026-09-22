using Microsoft.EntityFrameworkCore;
using RotaLand.Api.Data;

namespace RotaLand.Api.Endpoints.Employees;

public static class GetEmployeeEndpoint
{
    public static void MapGetEmployeeEndpoint(this WebApplication app)
    {
        app.MapGet("/api/employees/{employeeId:guid}", async (
            Guid employeeId,
            RotaLandDbContext db) =>
        {
            var employee = await db.Employees
                .AsNoTracking()
                .Include(e => e.Department)
                .Where(e => e.Id == employeeId)
                .Select(e => new
                {
                    e.Id,
                    e.FirstName,
                    e.LastName,
                    e.Email,
                    e.Role,
                    e.ContractedHoursPerWeek,
                    e.DepartmentId,
                    DepartmentName = e.Department.Name,
                    e.IsActive
                })
                .FirstOrDefaultAsync();

            return employee is null
                ? Results.NotFound(new { message = "Employee not found." })
                : Results.Ok(employee);
        });
    }
}
