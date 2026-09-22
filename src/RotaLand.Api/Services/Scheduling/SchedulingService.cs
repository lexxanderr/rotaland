using RotaLand.Api.Domain.Scheduling;

namespace RotaLand.Api.Services.Scheduling;

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
}