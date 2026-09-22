using RotaLand.Api.Domain.Departments;
using RotaLand.Api.Domain.Scheduling;

namespace RotaLand.Api.Domain.Employees;

public class Employee
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public required string FirstName { get; set; }

    public required string LastName { get; set; }

    public required string Email { get; set; }

    public required string Role { get; set; }

    public decimal ContractedHoursPerWeek { get; set; }

    public Guid DepartmentId { get; set; }

    public required Department Department { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public bool IsActive { get; set; } = true;

    public ICollection<Shift> Shifts { get; set; } = new List<Shift>();
}