using RotaLand.Api.Domain.Scheduling;

namespace RotaLand.Api.Services.Scheduling;

public record HoursSummary(
    decimal ContractedHours,
    decimal ScheduledHours,
    decimal RemainingHours,
    decimal OverHours,
    decimal UtilisationPercent,
    bool IsOverContract
);

public class SchedulingService
{
    public bool HasOverlap(Shift newShift, IEnumerable<Shift> existingShifts)
    {
        return existingShifts.Any(existingShift =>
            existingShift.EmployeeId == newShift.EmployeeId &&
            newShift.StartUtc < existingShift.EndUtc &&
            newShift.EndUtc > existingShift.StartUtc);
    }

    public decimal CalculateScheduledHours(IEnumerable<Shift> shifts)
    {
        return shifts.Sum(shift => shift.GetPaidHours());
    }

    public HoursSummary CalculateHoursSummary(
        decimal contractedHours,
        IEnumerable<Shift> shifts)
    {
        var scheduledHours = CalculateScheduledHours(shifts);

        var remainingHours = Math.Max(
            contractedHours - scheduledHours,
            0m);

        var overHours = Math.Max(
            scheduledHours - contractedHours,
            0m);

        var utilisationPercent = contractedHours > 0
            ? Math.Round((scheduledHours / contractedHours) * 100m, 1)
            : 0m;

        return new HoursSummary(
            contractedHours,
            scheduledHours,
            remainingHours,
            overHours,
            utilisationPercent,
            scheduledHours > contractedHours
        );
    }
}
