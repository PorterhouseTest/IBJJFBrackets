import { Card, Badge } from "@/components/ui";
import { athleteUrl, countryFlag, externalUrl } from "@/components/links";
import { getEventsData } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function EventsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const { events, radar } = await getEventsData();
  const mode = params.mode ?? "exact";
  const athlete = (params.athlete ?? "").toLowerCase();
  const team = (params.team ?? "").toLowerCase();
  const eventQuery = (params.event ?? "").toLowerCase();
  const showPast = params.past === "on";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const showRadar = mode === "radar" || mode === "all";
  const showExact = mode === "exact" || mode === "all";
  const filteredEvents = events
    .filter((event) => showPast || !event.eventStartDate || event.eventStartDate >= today)
    .filter((event) => event.eventName.toLowerCase().includes(eventQuery))
    .map((event) => ({
      ...event,
      competitors: event.competitors
        .filter((item) => item.athleteName.toLowerCase().includes(athlete) && (item.team ?? "").toLowerCase().includes(team))
        .sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1))
    }))
    .filter((event) => event.competitors.length > 0 || (!athlete && !team));
  const filteredRadar = radar.filter(
    (item) =>
      item.athleteName.toLowerCase().includes(athlete) &&
      (item.team ?? "").toLowerCase().includes(team) &&
      item.eventName.toLowerCase().includes(eventQuery) &&
      (showPast || !item.eventStartDate || item.eventStartDate >= today)
  );
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-semibold">Events</h1>
        <p className="mt-1 text-sm text-zinc-400">Exact division entries first, with radar registrations below.</p>
      </div>
      <form className="grid gap-3 md:grid-cols-6">
        <input name="athlete" defaultValue={params.athlete} className="rounded border border-line px-3 py-2 text-sm" placeholder="Search athlete" />
        <input name="team" defaultValue={params.team} className="rounded border border-line px-3 py-2 text-sm" placeholder="Search team" />
        <input name="event" defaultValue={params.event} className="rounded border border-line px-3 py-2 text-sm" placeholder="Search event" />
        <select name="mode" className="rounded border border-line px-3 py-2 text-sm" defaultValue={mode}>
          <option value="exact">Exact only</option>
          <option value="radar">Radar only</option>
          <option value="all">All</option>
        </select>
        <label className="flex items-center gap-2 rounded border border-line px-3 py-2 text-sm text-zinc-300">
          <input name="past" type="checkbox" defaultChecked={showPast} /> Show past events
        </label>
        <button className="rounded border border-line px-3 py-2 text-sm hover:border-accent">Apply</button>
      </form>
      {showExact ? filteredEvents.map((event) => (
        <Card key={event.id}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">{event.eventName}</h2>
              <p className="mt-1 text-sm text-zinc-400">{event.competitorCount} competitor(s) / BLACK / Master 2 / Male / Light Feather</p>
            </div>
            <a href={externalUrl(event.registrationLink) ?? "#"} className="rounded border border-line px-3 py-2 text-sm hover:border-accent">
              Registration
            </a>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="text-xs uppercase text-zinc-500">
                <tr>
                  <th className="py-2">Name</th>
                  <th>Team</th>
                  <th>Country</th>
                  <th>Rank</th>
                  <th>Rating</th>
                  <th>Matches</th>
                  <th>Seed / Ordinal</th>
                  <th>Links</th>
                </tr>
              </thead>
              <tbody>
                {event.competitors.map((item) => (
                  <tr key={item.id} className="border-t border-line">
                    <td className="py-3 font-medium">{item.athleteName}</td>
                    <td>{item.team ?? "n/a"}</td>
                    <td>{countryFlag(item.country)}</td>
                    <td>{item.rank ?? "n/a"}</td>
                    <td>{item.rating ?? "n/a"}</td>
                    <td>{item.matchCount ?? "n/a"}</td>
                    <td>{item.seed ?? "n/a"} / {item.ordinal ?? "n/a"}</td>
                    <td className="space-x-2">
                      {item.instagram ? <a className="text-accent" href={`https://instagram.com/${item.instagram}`}>IG</a> : null}
                      {athleteUrl(item.slug) ? <a className="text-accent" href={athleteUrl(item.slug)!}>JJ</a> : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )) : null}
      {showRadar ? <Card>
        <h2 className="text-xl font-semibold">Radar registrations</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {filteredRadar.map((item) => (
            <div key={item.id} className="rounded border border-line p-3">
              <div className="flex justify-between gap-3">
                <span className="font-medium">{item.athleteName}</span>
                <Badge>RADAR</Badge>
              </div>
              <p className="mt-1 text-sm text-zinc-400">{item.eventName}</p>
              <p className="text-xs text-zinc-500">{item.registeredDivision}</p>
            </div>
          ))}
          {filteredRadar.length === 0 ? <p className="text-sm text-zinc-500">No radar registrations found.</p> : null}
        </div>
      </Card> : null}
    </div>
  );
}
