using Microsoft.EntityFrameworkCore;
using RotaLand.Api.Data;
using RotaLand.Api.Endpoints.Shifts;
using RotaLand.Api.Endpoints.Employees;
using RotaLand.Api.Services.Scheduling;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException(
        "Connection string 'DefaultConnection' was not found.");

builder.Services.AddDbContext<RotaLandDbContext>(options =>
    options.UseNpgsql(connectionString));

builder.Services.AddScoped<SchedulingService>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.MapGet("/", () => Results.Ok(new
{
    application = "RotaLand API",
    status = "running"
}));

app.MapCreateShiftEndpoint();
app.MapGetShiftsEndpoint();
app.MapGetEmployeeShiftsEndpoint();
app.MapGetWeeklyRotaEndpoint();
app.MapDeleteShiftEndpoint();
app.MapUpdateShiftEndpoint();
app.MapCreateEmployeeEndpoint();
app.MapGetEmployeesEndpoint();
app.MapGetEmployeeEndpoint();
app.MapUpdateEmployeeEndpoint();
app.MapDeleteEmployeeEndpoint();

app.Run();