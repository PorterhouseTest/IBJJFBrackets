"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Card, Stat, Badge } from "@/components/ui";
import type { LiveScanResult } from "@/lib/live-scan";

const storagePrefix = "bracket-watch:last-scan:";
const genderOptions = ["Male", "Female"];
const ageOptions = ["Adult", "Master 1", "Master 2", "Master 3", "Master 4", "Master 5", "Master 6", "Master 7"];
const beltOptions = ["WHITE", "BLUE", "PURPLE", "BROWN", "BLACK"];
const weightOptions = ["Rooster", "Light Feather", "Feather", "Light", "Middle", "Medium Heavy", "Heavy", "Super Heavy", "Ultra Heavy", "Open Class"];

export function LiveDashboard() {
  const [current, setCurrent] = useState<LiveScanResult | null>(null);
  const [division, setDivision] = useState({
    gi: true,
    gender: "Male",
    age: "Master 2",
    belt: "BLACK",
    weight: "Light Feather"
  });
  const [openEvents, setOpenEvents] = useState<Record<string, boolean>>({});
  const [openRadarEvents, setOpenRadarEvents] = useState<Record<string, boolean>>({});
  const [status, setStatus] = useState<"idle" | "running" | "error">("idle");
  const [error, setError] = useState("");
  const [hasMounted, setHasMounted] = useState(false);
  const activeRequest = useRef(0);
  const abortController = useRef<AbortController | null>(null);
  const selectedExactDivision = `${division.belt} / ${division.age} / ${division.gender} / ${division.weight}`;
  const selectedScanKey = `${division.gi ? "gi" : "nogi"}|${selectedExactDivision}`;
  const displayed = current?.exactDivision === selectedExactDivision && current.gi === division.gi ? current : null;
  const radarEvents = useMemo(() => {
    const grouped = new Map<string, NonNullable<LiveScanResult["radarAthletes"]>>();
    for (const athlete of displayed?.radarAthletes ?? []) {
      grouped.set(athlete.eventName, [...(grouped.get(athlete.eventName) ?? []), athlete]);
    }
    return [...grouped.entries()]
      .map(([eventName, athletes]) => ({
        eventName,
        athletes: athletes.sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1))
      }))
      .sort((a, b) => a.eventName.localeCompare(b.eventName));
  }, [displayed]);

  useEffect(() => {
    const saved = window.localStorage.getItem(selectedStorageKey(selectedScanKey));
    if (saved) setCurrent(JSON.parse(saved) as LiveScanResult);
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (!hasMounted) return;
    const saved = window.localStorage.getItem(selectedStorageKey(selectedScanKey));
    setCurrent(saved ? (JSON.parse(saved) as LiveScanResult) : null);
    setOpenEvents({});
    setOpenRadarEvents({});
    const timeout = window.setTimeout(() => {
      void runScan();
    }, 700);
    return () => window.clearTimeout(timeout);
  }, [selectedScanKey, hasMounted]);

  async function runScan() {
    const requestId = activeRequest.current + 1;
    activeRequest.current = requestId;
    abortController.current?.abort();
    const controller = new AbortController();
    abortController.current = controller;
    setStatus("running");
    setError("");
    try {
      const response = await fetch("/api/live-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(division),
        signal: controller.signal
      });
      const payload = (await response.json()) as LiveScanResult | { error: string };
      if (!response.ok || "error" in payload) throw new Error("error" in payload ? payload.error : "Live scan failed");
      if (requestId !== activeRequest.current) return;
      setCurrent(payload);
      setOpenEvents({});
      setOpenRadarEvents({});
      window.localStorage.setItem(selectedStorageKey(selectedScanKey), JSON.stringify(payload));
      setStatus("idle");
    } catch (scanError) {
      if (controller.signal.aborted) return;
      if (requestId !== activeRequest.current) return;
      setError(scanError instanceof Error ? scanError.message : "Live scan failed");
      setStatus("error");
    }
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <div>
          <h1 className="text-4xl font-semibold">Bracket Watch</h1>
          <p className="mt-2 text-zinc-400">
            {division.gi ? "Gi" : "No Gi"} / {division.gender} / {division.age} / {division.belt} / {division.weight}
          </p>
        </div>
        <button onClick={runScan} disabled={status === "running"} className="rounded bg-accent px-4 py-2 font-semibold text-black disabled:opacity-60">
          {status === "running" ? "Scanning..." : "Refresh Scan"}
        </button>
      </section>

      {error ? (
        <Card className="border-red-400/50 bg-red-950/30">
          <h2 className="font-semibold text-red-200">Scan failed</h2>
          <p className="mt-1 text-sm text-red-100">{error}</p>
        </Card>
      ) : null}

      <Card>
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-sm text-zinc-400">Changing a dropdown automatically runs a fresh scan.</p>
          {status === "running" ? <span className="text-sm font-semibold text-accent">Scanning...</span> : null}
        </div>
        <div className="grid gap-3 md:grid-cols-5">
          <label className="text-xs uppercase tracking-wide text-zinc-500">
            Sport
            <select
              value={division.gi ? "Gi" : "No Gi"}
              onChange={(event) => setDivision((value) => ({ ...value, gi: event.target.value === "Gi" }))}
              className="mt-2 w-full rounded border border-line px-3 py-2 text-sm text-white"
            >
              <option>Gi</option>
              <option>No Gi</option>
            </select>
          </label>
          <DivisionSelect label="Gender" value={division.gender} options={genderOptions} onChange={(gender) => setDivision((value) => ({ ...value, gender }))} />
          <DivisionSelect label="Age" value={division.age} options={ageOptions} onChange={(age) => setDivision((value) => ({ ...value, age }))} />
          <DivisionSelect label="Belt" value={division.belt} options={beltOptions} onChange={(belt) => setDivision((value) => ({ ...value, belt }))} />
          <DivisionSelect label="Weight" value={division.weight} options={weightOptions} onChange={(weight) => setDivision((value) => ({ ...value, weight }))} />
        </div>
      </Card>

      <section className="grid gap-3 md:grid-cols-3">
        <Stat label="Exact events" value={displayed?.exactEventsFound ?? 0} />
        <Stat label="Exact competitors" value={displayed?.exactCompetitorsFound ?? 0} />
        <Stat label="Radar events" value={radarEvents.length} />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card>
          <h2 className="text-lg font-semibold">Exact Division</h2>
          <p className="mt-1 text-sm text-zinc-400">Events that currently have people registered in {selectedExactDivision}.</p>
          <div className="mt-4 space-y-3">
            {displayed?.exactEvents.map((event) => {
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
            {!displayed?.exactEventsFound ? (
              <p className="text-sm text-zinc-500">{status === "running" ? "Checking events for this division..." : "No exact events found yet."}</p>
            ) : null}
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold">Radar</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Events where target-ranked athletes are registered somewhere upcoming, even if the registered division is different.
          </p>
          <div className="mt-4 space-y-3">
            {radarEvents.map((event) => {
              const isOpen = openRadarEvents[event.eventName] ?? false;
              const topAthlete = event.athletes[0];
              return (
                <div key={event.eventName} className="rounded border border-line bg-black/10">
                  <button
                    onClick={() => setOpenRadarEvents((value) => ({ ...value, [event.eventName]: !isOpen }))}
                    className="flex w-full items-center justify-between gap-4 p-4 text-left hover:bg-white/[0.03]"
                  >
                    <div>
                      <h3 className="font-semibold">{event.eventName}</h3>
                      <p className="mt-1 text-sm text-zinc-400">
                        {event.athletes.length} radar athlete{event.athletes.length === 1 ? "" : "s"} / top rating {topAthlete?.rating ?? "n/a"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge>{event.athletes.length}</Badge>
                      <span className="text-xl text-zinc-400">{isOpen ? "-" : "+"}</span>
                    </div>
                  </button>
                  {isOpen ? (
                    <div className="border-t border-line p-4">
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[760px] text-left text-sm">
                          <thead className="text-xs uppercase text-zinc-500">
                            <tr>
                              <th className="py-2">Athlete</th>
                              <th>Registered division</th>
                              <th>Country</th>
                              <th>Rank</th>
                              <th>Rating</th>
                              <th>Matches</th>
                              <th>Instagram</th>
                            </tr>
                          </thead>
                          <tbody>
                            {event.athletes.map((athlete) => (
                              <tr key={`${event.eventName}-${athlete.athleteName}-${athlete.registeredDivision}`} className="border-t border-line">
                                <td className="py-3 font-medium">{athlete.athleteName}</td>
                                <td>{athlete.registeredDivision}</td>
                                <td>{athlete.country ?? "n/a"}</td>
                                <td>{athlete.rank ?? "n/a"}</td>
                                <td>{athlete.rating ?? "n/a"}</td>
                                <td>{athlete.matchCount ?? "n/a"}</td>
                                <td>
                                  {athlete.instagram ? (
                                    <a className="text-accent" href={`https://instagram.com/${athlete.instagram}`}>
                                      Instagram
                                    </a>
                                  ) : (
                                    "n/a"
                                  )}
                                </td>
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
            {!displayed?.radarAthletesFound ? (
              <p className="text-sm text-zinc-500">{status === "running" ? "Checking radar athletes for this division..." : "No radar athletes found yet."}</p>
            ) : null}
          </div>
        </Card>
      </section>
    </div>
  );
}

function selectedStorageKey(scanKey: string) {
  return `${storagePrefix}${scanKey}`;
}

function DivisionSelect({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="text-xs uppercase tracking-wide text-zinc-500">
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full rounded border border-line px-3 py-2 text-sm text-white">
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
