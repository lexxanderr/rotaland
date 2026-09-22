using Microsoft.EntityFrameworkCore;
using RotaLand.Api.Data;

namespace RotaLand.Api.Endpoints.Employees;

public static class GetEmployeesEndpoint
{
    public static void MapGetEmployeesEndpoint(this WebApplication app)
    {
        app.MapGet("/api/employees", async (RotaLandDbContext db) =>
        {
            var employees = await db.Employees
                .AsNoTracking()
                .Include(e => e.Department)
                .OrderBy(e => e.FirstName)
                .ThenBy(e => e.LastName)
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
                .ToListAsync();

            return Results.Ok(employees);
        });
    }
}
