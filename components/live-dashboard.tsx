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
        <Card>
          <h2 className="text-lg font-semibold">Exact Division</h2>
          <p className="mt-1 text-sm text-zinc-400">People currently registered in BLACK / Master 2 / Male / Light Feather.</p>
          <div className="mt-4 space-y-3">
            {current?.exactEvents.flatMap((event) =>
              event.competitors.map((competitor) => (
                <div key={`${event.eventName}-${competitor.name}`} className="border-t border-line pt-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{competitor.name}</span>
                    <Badge tone="accent">EXACT</Badge>
                  </div>
                  <p className="text-sm text-zinc-400">{event.eventName}</p>
                  <p className="text-xs text-zinc-500">
                    {competitor.team ?? "Team unavailable"} / Rank {competitor.rank ?? "n/a"} / {competitor.rating ?? "n/a"}
                  </p>
                </div>
              ))
            )}
            {!current?.exactCompetitorsFound ? <p className="text-sm text-zinc-500">No exact competitors found yet.</p> : null}
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold">Radar</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Athletes ranked in your target division who are registered somewhere upcoming, even if the registered division is different.
          </p>
          <div className="mt-4 space-y-3">
            {current?.radarAthletes.slice(0, 12).map((athlete) => (
              <div key={`${athlete.eventName}-${athlete.athleteName}-${athlete.registeredDivision}`} className="border-t border-line pt-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{athlete.athleteName}</span>
                  <Badge>RADAR</Badge>
                </div>
                <p className="text-sm text-zinc-400">{athlete.eventName}</p>
                <p className="text-xs text-zinc-500">{athlete.registeredDivision}</p>
              </div>
            ))}
            {!current?.radarAthletesFound ? <p className="text-sm text-zinc-500">No radar athletes found yet.</p> : null}
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
    </div>
  );
}
