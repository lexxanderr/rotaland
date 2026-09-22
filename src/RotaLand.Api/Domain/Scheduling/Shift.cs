using RotaLand.Api.Domain.Employees;

namespace RotaLand.Api.Domain.Scheduling;

public class Shift
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid EmployeeId { get; set; }

    public required Employee Employee { get; set; }

    public DateTime StartUtc { get; set; }

    public DateTime EndUtc { get; set; }

    public int BreakMinutes { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public bool HasValidTimeRange()
    {
        return EndUtc > StartUtc;
    }

    public bool HasValidBreak()
    {
        if (BreakMinutes < 0 || !HasValidTimeRange())
        {
            return false;
        }

        var shiftMinutes = (EndUtc - StartUtc).TotalMinutes;

        return BreakMinutes < shiftMinutes;
    }

    public decimal GetPaidHours()
    {
        if (!HasValidTimeRange() || !HasValidBreak())
        {
            return 0;
        }

        var totalMinutes = (EndUtc - StartUtc).TotalMinutes;
        var paidMinutes = totalMinutes - BreakMinutes;

        return (decimal)(paidMinutes / 60);
    }
}