import { format } from "date-fns";
import { Card, Stat, Badge } from "@/components/ui";
import { ManualScanButton } from "@/components/manual-scan-button";
import { athleteUrl } from "@/components/links";
import { getDashboardData } from "@/lib/data";

function when(date: Date | null | undefined) {
  return date ? format(date, "MMM d, yyyy h:mm a") : "Not yet";
}

export default async function DashboardPage() {
  const data = await getDashboardData();
  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <div>
          <h1 className="text-4xl font-semibold">Bracket Watch</h1>
          <p className="mt-2 text-zinc-400">Gi / Male / Master 2 / Black / Light Feather</p>
        </div>
        <ManualScanButton />
      </section>

      <section className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
        <Stat label="Last successful scan" value={when(data.latest?.finishedAt)} />
        <Stat label="Next scan time" value={when(data.nextScan)} />
        <Stat label="Exact events" value={data.latest?.exactEventsFound ?? 0} />
        <Stat label="Exact competitors" value={data.latest?.exactCompetitorsFound ?? 0} />
        <Stat label="Radar athletes" value={data.latest?.radarAthletesFound ?? 0} />
        <Stat label="Changes" value={data.changes.length} />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card>
          <h2 className="text-lg font-semibold">Exact Division</h2>
          <p className="mt-1 text-sm text-zinc-400">People currently registered in BLACK / Master 2 / Male / Light Feather.</p>
          <div className="mt-4 space-y-3">
            {data.exactCompetitors.slice(0, 6).map((item) => (
              <div key={item.id} className="border-t border-line pt-3">
                <div className="flex items-center justify-between gap-2">
                  <a href={athleteUrl(item.slug) ?? "#"} className="font-medium hover:text-accent">
                    {item.athleteName}
                  </a>
                  <Badge tone="accent">EXACT</Badge>
                </div>
                <p className="text-sm text-zinc-400">{item.eventName}</p>
                <p className="text-xs text-zinc-500">{item.team ?? "Team unavailable"} / Rank {item.rank ?? "n/a"} / {item.rating ?? "n/a"}</p>
              </div>
            ))}
            {data.exactCompetitors.length === 0 ? <p className="text-sm text-zinc-500">No exact competitors found yet.</p> : null}
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold">Radar</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Athletes ranked in your target division who are registered somewhere upcoming, even if the registered division is different.
          </p>
          <div className="mt-4 space-y-3">
            {data.radarCompetitors.slice(0, 6).map((item) => (
              <div key={item.id} className="border-t border-line pt-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{item.athleteName}</span>
                  <Badge>RADAR</Badge>
                </div>
                <p className="text-sm text-zinc-400">{item.eventName}</p>
                <p className="text-xs text-zinc-500">{item.registeredDivision}</p>
              </div>
            ))}
            {data.radarCompetitors.length === 0 ? <p className="text-sm text-zinc-500">No radar athletes found yet.</p> : null}
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold">Changes</h2>
          <p className="mt-1 text-sm text-zinc-400">Movement since the last successful scan.</p>
          <div className="mt-4 space-y-3">
            {data.changes.map((change) => (
              <div key={change.id} className="border-t border-line pt-3">
                <p className="font-medium">{change.title}</p>
                <p className="text-sm text-zinc-400">{change.description}</p>
              </div>
            ))}
            {data.changes.length === 0 ? <p className="text-sm text-zinc-500">No changes recorded for the latest scan.</p> : null}
          </div>
        </Card>
      </section>
    </div>
  );
}
