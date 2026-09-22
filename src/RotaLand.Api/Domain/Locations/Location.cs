using RotaLand.Api.Domain.Departments;
using RotaLand.Api.Domain.Organisations;

namespace RotaLand.Api.Domain.Locations;

public class Location
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public required string Name { get; set; }

    public Guid OrganisationId { get; set; }

    public required Organisation Organisation { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public bool IsActive { get; set; } = true;

    public ICollection<Department> Departments { get; set; } = new List<Department>();
}
