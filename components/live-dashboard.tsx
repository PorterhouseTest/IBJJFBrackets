"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, Stat, Badge } from "@/components/ui";
import type { LiveScanResult } from "@/lib/live-scan";

const storageKey = "bracket-watch:last-scan";

type Change = {
  title: string;
  description: string;
  tone: "accent" | "default";
};

function competitorKey(scan: LiveScanResult) {
  return scan.exactEvents.flatMap((event) =>
    event.competitors.map((competitor) => `${event.eventName}|${competitor.name}|${competitor.registeredDivision}`)
  );
}

function radarKey(scan: LiveScanResult) {
  return scan.radarAthletes.map((athlete) => `${athlete.eventName}|${athlete.athleteName}|${athlete.registeredDivision}`);
}

function changes(previous: LiveScanResult | null, current: LiveScanResult | null): Change[] {
  if (!previous || !current) return [];
  const output: Change[] = [];
  const oldCompetitors = new Set(competitorKey(previous));
  const newCompetitors = new Set(competitorKey(current));
  const oldRadar = new Set(radarKey(previous));
  const newRadar = new Set(radarKey(current));

  for (const key of newCompetitors) {
    if (!oldCompetitors.has(key)) {
      const [eventName, athleteName] = key.split("|");
      output.push({ title: "New exact competitor", description: `${athleteName} appeared in ${eventName}.`, tone: "accent" });
    }
  }
  for (const key of oldCompetitors) {
    if (!newCompetitors.has(key)) {
      const [eventName, athleteName] = key.split("|");
      output.push({ title: "Removed exact competitor", description: `${athleteName} is no longer listed in ${eventName}.`, tone: "accent" });
    }
  }
  for (const key of newRadar) {
    if (!oldRadar.has(key)) {
      const [eventName, athleteName, division] = key.split("|");
      output.push({ title: "New radar athlete", description: `${athleteName} is registered for ${eventName} in ${division}.`, tone: "default" });
    }
  }
  return output;
}

export function LiveDashboard() {
  const [current, setCurrent] = useState<LiveScanResult | null>(null);
  const [previous, setPrevious] = useState<LiveScanResult | null>(null);
  const [openEvents, setOpenEvents] = useState<Record<string, boolean>>({});
  const [status, setStatus] = useState<"idle" | "running" | "error">("idle");
  const [error, setError] = useState("");
  const scanChanges = useMemo(() => changes(previous, current), [previous, current]);

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey);
    if (saved) setCurrent(JSON.parse(saved) as LiveScanResult);
  }, []);

  async function runScan() {
    setStatus("running");
    setError("");
    try {
      const response = await fetch("/api/live-scan", { method: "POST" });
      const payload = (await response.json()) as LiveScanResult | { error: string };
      if (!response.ok || "error" in payload) throw new Error("error" in payload ? payload.error : "Live scan failed");
      setPrevious(current);
      setCurrent(payload);
      window.localStorage.setItem(storageKey, JSON.stringify(payload));
      setStatus("idle");
    } catch (scanError) {
      setError(scanError instanceof Error ? scanError.message : "Live scan failed");
      setStatus("error");
    }
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <div>
          <h1 className="text-4xl font-semibold">Bracket Watch</h1>
          <p className="mt-2 text-zinc-400">Gi / Male / Master 2 / Black / Light Feather</p>
        </div>
        <button onClick={runScan} disabled={status === "running"} className="rounded bg-accent px-4 py-2 font-semibold text-black disabled:opacity-60">
          {status === "running" ? "Scanning..." : "Run Scan Now"}
        </button>
      </section>

      {error ? (
        <Card className="border-red-400/50 bg-red-950/30">
          <h2 className="font-semibold text-red-200">Scan failed</h2>
          <p className="mt-1 text-sm text-red-100">{error}</p>
        </Card>
      ) : null}

      <section className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
        <Stat label="Last scan" value={current ? new Date(current.scannedAt).toLocaleString() : "Not yet"} />
        <Stat label="Exact events" value={current?.exactEventsFound ?? 0} />
        <Stat label="Exact competitors" value={current?.exactCompetitorsFound ?? 0} />
        <Stat label="Radar athletes" value={current?.radarAthletesFound ?? 0} />
        <Stat label="Changes" value={scanChanges.length} />
        <Stat label="Requests" value={current?.requestsMade ?? 0} />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h2 className="text-lg font-semibold">Exact Division</h2>
          <p className="mt-1 text-sm text-zinc-400">Events that currently have people registered in BLACK / Master 2 / Male / Light Feather.</p>
          <div className="mt-4 space-y-3">
            {current?.exactEvents.map((event) => {
              const isOpen = openEvents[event.eventName] ?? false;
              const topCompetitor = [...event.competitors].sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1))[0];
              return (
                <div key={event.eventName} className="rounded border border-line bg-black/10">
                  <button
                    onClick={() => setOpenEvents((value) => ({ ...value, [event.eventName]: !isOpen }))}
                    className="flex w-full items-center justify-between gap-4 p-4 text-left hover:bg-white/[0.03]"
                  >
                    <div>
                      <h3 className="font-semibold">{event.eventName}</h3>
                      <p className="mt-1 text-sm text-zinc-400">
                        {event.competitors.length} registered / top rating {topCompetitor?.rating ?? "n/a"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge tone="accent">{event.competitors.length}</Badge>
                      <span className="text-xl text-zinc-400">{isOpen ? "-" : "+"}</span>
                    </div>
                  </button>
                  {isOpen ? (
                    <div className="border-t border-line p-4">
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[680px] text-left text-sm">
                          <thead className="text-xs uppercase text-zinc-500">
                            <tr>
                              <th className="py-2">Athlete</th>
                              <th>Team</th>
                              <th>Country</th>
                              <th>Rank</th>
                              <th>Rating</th>
                              <th>Matches</th>
                              <th>Seed</th>
                            </tr>
                          </thead>
                          <tbody>
                            {[...event.competitors]
                              .sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1))
                              .map((competitor) => (
                                <tr key={`${event.eventName}-${competitor.name}`} className="border-t border-line">
                                  <td className="py-3 font-medium">{competitor.name}</td>
                                  <td>{competitor.team ?? "n/a"}</td>
                                  <td>{competitor.country ?? "n/a"}</td>
                                  <td>{competitor.rank ?? "n/a"}</td>
                                  <td>{competitor.rating ?? "n/a"}</td>
                                  <td>{competitor.match_count ?? "n/a"}</td>
                                  <td>{competitor.seed ?? "n/a"}</td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
            {!current?.exactEventsFound ? <p className="text-sm text-zinc-500">No exact events found yet.</p> : null}
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold">Changes</h2>
          <p className="mt-1 text-sm text-zinc-400">Movement since your previous scan in this browser.</p>
          <div className="mt-4 space-y-3">
            {scanChanges.map((change) => (
              <div key={`${change.title}-${change.description}`} className="border-t border-line pt-3">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{change.title}</p>
                  <Badge tone={change.tone}>{change.tone === "accent" ? "IMPORTANT" : "INFO"}</Badge>
                </div>
                <p className="text-sm text-zinc-400">{change.description}</p>
              </div>
            ))}
            {scanChanges.length === 0 ? <p className="text-sm text-zinc-500">No changes recorded yet. Run a scan now, then compare against the next scan.</p> : null}
          </div>
        </Card>
      </section>

      <section className="grid gap-4">
        <Card>
          <h2 className="text-lg font-semibold">Radar</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Athletes ranked in your target division who are registered somewhere upcoming, even if the registered division is different.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {current?.radarAthletes.slice(0, 18).map((athlete) => (
              <div key={`${athlete.eventName}-${athlete.athleteName}-${athlete.registeredDivision}`} className="rounded border border-line p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{athlete.athleteName}</span>
                  <Badge>RADAR</Badge>
                </div>
                <p className="mt-1 text-sm text-zinc-400">{athlete.eventName}</p>
                <p className="text-xs text-zinc-500">{athlete.registeredDivision}</p>
              </div>
            ))}
            {!current?.radarAthletesFound ? <p className="text-sm text-zinc-500">No radar athletes found yet.</p> : null}
          </div>
        </Card>
      </section>
    </div>
  );
}