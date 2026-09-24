namespace RotaLand.Api.Services.Scheduling;

public static class RotaWeek
{
    public static DateTime GetMonday(DateTime value)
    {
        // Rota weeks are calendar-date based.
        // Do not convert to UTC before determining the weekday,
        // otherwise local midnight can move into the previous date.
        var date = DateTime.SpecifyKind(value.Date, DateTimeKind.Utc);

        var daysSinceMonday = ((int)date.DayOfWeek + 6) % 7;
        return date.AddDays(-daysSinceMonday);
    }
}
