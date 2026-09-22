using Microsoft.EntityFrameworkCore;
using RotaLand.Api.Domain.Departments;
using RotaLand.Api.Domain.Employees;
using RotaLand.Api.Domain.Locations;
using RotaLand.Api.Domain.Organisations;
using RotaLand.Api.Domain.Scheduling;

namespace RotaLand.Api.Data;

public class RotaLandDbContext(DbContextOptions<RotaLandDbContext> options)
    : DbContext(options)
{
    public DbSet<Organisation> Organisations => Set<Organisation>();

    public DbSet<Location> Locations => Set<Location>();

    public DbSet<Department> Departments => Set<Department>();

    public DbSet<Employee> Employees => Set<Employee>();

    public DbSet<Shift> Shifts => Set<Shift>();
}