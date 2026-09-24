using Microsoft.EntityFrameworkCore;
using RotaLand.Api.Data;
using RotaLand.Api.Domain.Scheduling;
using RotaLand.Api.Services.Scheduling;

namespace RotaLand.Api.Endpoints.Rota;

public static class PublishRotaEndpoint
{
    public static void MapPublishRotaEndpoint(this WebApplication app)
    {
        app.MapPut("/api/rota/week/publish", async (
            DateTime start,
            RotaLandDbContext db) =>
        {
            var weekStart = RotaWeek.GetMonday(start);
            var now = DateTime.UtcNow;

            var publication = await db.RotaPublications
                .SingleOrDefaultAsync(r => r.WeekStartUtc == weekStart);

            if (publication is null)
            {
                publication = new RotaPublication
                {
                    WeekStartUtc = weekStart,
                    Status = "Published",
                    Version = 1,
                    PublishedAtUtc = now
                };

                db.RotaPublications.Add(publication);
            }
            else
            {
                if (publication.Status == "Published")
                {
                    return Results.Conflict(new
                    {
                        message = "This rota is already published."
                    });
                }

                publication.Version++;

                if (publication.Version == 1)
                {
                    publication.PublishedAtUtc = now;
                }
                else
                {
                    publication.LastUpdatedAtUtc = now;
                }

                publication.Status = "Published";
            }

            await db.SaveChangesAsync();

            return Results.Ok(new
            {
                publication.WeekStartUtc,
                Status = publication.Version > 1 ? "Updated" : "Published",
                publication.Version,
                publication.PublishedAtUtc,
                publication.LastUpdatedAtUtc
            });
        });
    }
}
