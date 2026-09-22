namespace RotaLand.Api.Endpoints.Employees;

public record CreateEmployeeRequest(
    string FirstName,
    string LastName,
    string Email,
    string Role,
    decimal ContractedHoursPerWeek,
    Guid DepartmentId
);
