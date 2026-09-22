using RotaLand.Api.Data;

namespace RotaLand.Api.Endpoints.Requests;

public static class RejectTimeOffRequestEndpoint
{
    public static void MapRejectTimeOffRequestEndpoint(this WebApplication app)
    {
        app.MapPut("/api/requests/time-off/{requestId:guid}/reject", async (
            Guid requestId,
            RotaLandDbContext db) =>
        {
            var request = await db.TimeOffRequests.FindAsync(requestId);

            if (request is null)
            {
                return Results.NotFound(new
                {
                    message = "Time-off request not found."
                });
            }

            if (request.Status != "Pending")
            {
                return Results.BadRequest(new
                {
                    message = "Only pending requests can be rejected."
                });
            }

            request.Status = "Rejected";
            request.ReviewedAtUtc = DateTime.UtcNow;

            await db.SaveChangesAsync();

            return Results.NoContent();
        });
    }
}
