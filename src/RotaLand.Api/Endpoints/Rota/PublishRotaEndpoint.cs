using Microsoft.EntityFrameworkCore;
using RotaLand.Api.Data;
using RotaLand.Api.Domain.Scheduling;

namespace RotaLand.Api.Endpoints.Rota;

public static class PublishRotaEndpoint
{
    public static void MapPublishRotaEndpoint(this WebApplication app)
    {
        app.MapPut("/api/rota/week/publish", async (
            DateTime start,
            RotaLandDbContext db) =>
        {
            var weekStart = DateTime.SpecifyKind(start.Date, DateTimeKind.Utc);

            var publication = await db.RotaPublications
                .SingleOrDefaultAsync(r => r.WeekStartUtc == weekStart);

            if (publication is null)
            {
                publication = new RotaPublication
                {
                    WeekStartUtc = weekStart,
                    Status = "Published",
                    PublishedAtUtc = DateTime.UtcNow
                };

                db.RotaPublications.Add(publication);
            }
            else
            {
                publication.Status = "Published";
                publication.PublishedAtUtc = DateTime.UtcNow;
            }

            await db.SaveChangesAsync();

            return Results.Ok(new
            {
                publication.WeekStartUtc,
                publication.Status,
                publication.PublishedAtUtc
            });
        });
    }
}
