namespace RotaLand.Api.Domain.Scheduling;

public class RotaPublication
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public DateTime WeekStartUtc { get; set; }

    public string Status { get; set; } = "Draft";

    public int Version { get; set; } = 0;

    public DateTime? PublishedAtUtc { get; set; }

    public DateTime? LastUpdatedAtUtc { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}
