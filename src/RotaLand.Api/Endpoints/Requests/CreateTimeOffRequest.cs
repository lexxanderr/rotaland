namespace RotaLand.Api.Endpoints.Requests;

public record CreateTimeOffRequest(
    Guid EmployeeId,
    DateOnly StartDate,
    DateOnly EndDate,
    string Reason
);
