using Microsoft.EntityFrameworkCore;
using RotaLand.Api.Data;
using RotaLand.Api.Services.Scheduling;

namespace RotaLand.Api.Endpoints.Rota;

public static class AmendRotaEndpoint
{
    public static void MapAmendRotaEndpoint(this WebApplication app)
    {
        app.MapPut("/api/rota/week/amend", async (
            DateTime start,
            RotaLandDbContext db) =>
        {
            var weekStart = RotaWeek.GetMonday(start);

            var publication = await db.RotaPublications
                .SingleOrDefaultAsync(r => r.WeekStartUtc == weekStart);

            if (publication is null || publication.Status != "Published")
            {
                return Results.BadRequest(new
                {
                    message = "Only a published rota can be amended."
                });
            }

            publication.Status = "Draft";

            await db.SaveChangesAsync();

            return Results.Ok(new
            {
                publication.WeekStartUtc,
                publication.Status,
                publication.Version,
                WasPreviouslyPublished = publication.Version > 0
            });
        });
    }
}
