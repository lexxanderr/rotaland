using RotaLand.Api.Domain.Employees;

namespace RotaLand.Api.Tests;

public class EmployeeTests
{
    [Fact]
    public void Employee_CanStoreContractedHours()
    {
        var employee = new Employee
        {
            FirstName = "Jordan",
            LastName = "Smith",
            Email = "jordan.smith@rotaland.local",
            Role = "Team Member",
            ContractedHoursPerWeek = 40,
            DepartmentId = Guid.NewGuid(),
            Department = null!
        };

        Assert.Equal(40m, employee.ContractedHoursPerWeek);
    }

    [Fact]
    public void Employee_IsActiveByDefault()
    {
        var employee = new Employee
        {
            FirstName = "Jordan",
            LastName = "Smith",
            Email = "jordan.smith@rotaland.local",
            Role = "Team Member",
            ContractedHoursPerWeek = 40,
            DepartmentId = Guid.NewGuid(),
            Department = null!
        };

        Assert.True(employee.IsActive);
    }
}
