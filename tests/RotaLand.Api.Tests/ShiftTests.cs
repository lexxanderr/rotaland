using RotaLand.Api.Domain.Scheduling;
using RotaLand.Api.Services.Scheduling;

namespace RotaLand.Api.Tests;

public class ShiftTests
{
    [Fact]
    public void HasValidTimeRange_ReturnsTrue_WhenEndIsAfterStart()
    {
        var shift = CreateShift(Guid.NewGuid(), 9, 17, 30);

        Assert.True(shift.HasValidTimeRange());
    }

    [Fact]
    public void GetPaidHours_ReturnsSevenPointFive_ForEightHourShiftWithThirtyMinuteBreak()
    {
        var shift = CreateShift(Guid.NewGuid(), 9, 17, 30);

        Assert.Equal(7.5m, shift.GetPaidHours());
    }

    [Fact]
    public void HasOverlap_ReturnsTrue_WhenSameEmployeeHasOverlappingShift()
    {
        var employeeId = Guid.NewGuid();

        var existingShift = CreateShift(employeeId, 9, 17);
        var newShift = CreateShift(employeeId, 15, 20);

        var service = new SchedulingService();

        Assert.True(service.HasOverlap(newShift, new[] { existingShift }));
    }

    [Fact]
    public void HasOverlap_ReturnsFalse_WhenShiftsTouchButDoNotOverlap()
    {
        var employeeId = Guid.NewGuid();

        var existingShift = CreateShift(employeeId, 9, 13);
        var newShift = CreateShift(employeeId, 13, 17);

        var service = new SchedulingService();

        Assert.False(service.HasOverlap(newShift, new[] { existingShift }));
    }

    [Fact]
    public void HasOverlap_ReturnsFalse_ForDifferentEmployees()
    {
        var existingShift = CreateShift(Guid.NewGuid(), 9, 17);
        var newShift = CreateShift(Guid.NewGuid(), 15, 20);

        var service = new SchedulingService();

        Assert.False(service.HasOverlap(newShift, new[] { existingShift }));
    }

    [Fact]
    public void CalculateScheduledHours_ReturnsTotalPaidHours()
    {
        var employeeId = Guid.NewGuid();

        var shifts = new[]
        {
            CreateShift(employeeId, 9, 17, 30),
            CreateShift(employeeId, 10, 18, 60),
            CreateShift(employeeId, 8, 15, 30)
        };

        var service = new SchedulingService();

        var totalHours = service.CalculateScheduledHours(shifts);

        Assert.Equal(21m, totalHours);
    }

    private static Shift CreateShift(
        Guid employeeId,
        int startHour,
        int endHour,
        int breakMinutes = 0)
    {
        return new Shift
        {
            EmployeeId = employeeId,
            Employee = null!,
            StartUtc = new DateTime(
                2026, 9, 22, startHour, 0, 0, DateTimeKind.Utc),
            EndUtc = new DateTime(
                2026, 9, 22, endHour, 0, 0, DateTimeKind.Utc),
            BreakMinutes = breakMinutes
        };
    }
}
