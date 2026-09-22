namespace RotaLand.Api.Endpoints.Shifts;

public record CreateShiftRequest(
    Guid EmployeeId,
    DateTime StartUtc,
    DateTime EndUtc,
    int BreakMinutes
);
