using Microsoft.EntityFrameworkCore;
using RotaLand.Api.Data;
using RotaLand.Api.Endpoints.Shifts;
using RotaLand.Api.Endpoints.Employees;
using RotaLand.Api.Services.Scheduling;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        policy
            .WithOrigins(
                "http://localhost:5173",
                "http://localhost:5174",
                "http://localhost:5175"
            )
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});


builder.Services.AddOpenApi();

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException(
        "Connection string 'DefaultConnection' was not found.");

builder.Services.AddDbContext<RotaLandDbContext>(options =>
    options.UseNpgsql(connectionString));

builder.Services.AddScoped<SchedulingService>();

var app = builder.Build();

app.UseCors("Frontend");


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
app.MapReactivateEmployeeEndpoint();

app.Run();