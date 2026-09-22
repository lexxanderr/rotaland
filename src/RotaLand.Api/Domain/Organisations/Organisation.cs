using RotaLand.Api.Domain.Locations;

namespace RotaLand.Api.Domain.Organisations;

public class Organisation
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public required string Name { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public bool IsActive { get; set; } = true;

    public ICollection<Location> Locations { get; set; } = new List<Location>();
}
