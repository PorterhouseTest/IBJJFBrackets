import { Card, Badge } from "@/components/ui";
import { athleteUrl, countryFlag } from "@/components/links";
import { getAthletesData } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function AthletesPage() {
  const items = await getAthletesData();
  const byAthlete = new Map<string, typeof items>();
  for (const item of items) byAthlete.set(item.athleteName, [...(byAthlete.get(item.athleteName) ?? []), item]);

  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-semibold">Athletes</h1>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[...byAthlete.entries()].map(([name, registrations]) => {
          const first = registrations[0];
          const exact = registrations.some((item) => item.sourceType === "EXACT_DIVISION");
          return (
            <Card key={name}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <a href={athleteUrl(first.slug) ?? "#"} className="text-lg font-semibold hover:text-accent">
                    {name}
                  </a>
                  <p className="text-sm text-zinc-400">{first.team ?? "Team unavailable"} / {countryFlag(first.country)}</p>
                </div>
                <Badge tone={exact ? "accent" : "default"}>{exact ? "EXACT" : "RADAR"}</Badge>
              </div>
              <p className="mt-3 text-sm text-zinc-300">Rating {first.rating ?? "n/a"} / Rank {first.rank ?? "n/a"}</p>
              <div className="mt-3 space-y-2">
                {registrations.map((item) => (
                  <div key={item.id} className="rounded border border-line p-2 text-sm">
                    <p>{item.eventName}</p>
                    <p className="text-xs text-zinc-500">{item.registeredDivision}</p>
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
