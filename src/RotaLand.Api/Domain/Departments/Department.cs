using RotaLand.Api.Domain.Employees;
using RotaLand.Api.Domain.Locations;

namespace RotaLand.Api.Domain.Departments;

public class Department
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public required string Name { get; set; }

    public Guid LocationId { get; set; }

    public required Location Location { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public bool IsActive { get; set; } = true;

    public ICollection<Employee> Employees { get; set; } = new List<Employee>();
}
