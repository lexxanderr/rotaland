using RotaLand.Api.Endpoints.Rota;
using RotaLand.Api.Endpoints.Requests;
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
            .SetIsOriginAllowed(origin =>
                origin == "https://rotaland.vercel.app" ||
                origin.StartsWith("http://localhost:") ||
                origin.StartsWith("http://172.20.10.4:"))
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
app.MapPublishRotaEndpoint();
app.MapAmendRotaEndpoint();
app.MapDeleteShiftEndpoint();
app.MapUpdateShiftEndpoint();
app.MapCreateEmployeeEndpoint();
app.MapGetEmployeesEndpoint();
app.MapGetEmployeeEndpoint();
app.MapUpdateEmployeeEndpoint();
app.MapDeleteEmployeeEndpoint();
app.MapReactivateEmployeeEndpoint();

app.MapCreateTimeOffRequestEndpoint();
app.MapGetTimeOffRequestsEndpoint();
app.MapApproveTimeOffRequestEndpoint();
app.MapRejectTimeOffRequestEndpoint();

app.Run();