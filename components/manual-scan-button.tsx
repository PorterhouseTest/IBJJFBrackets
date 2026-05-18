"use client";

import { useState } from "react";

export function ManualScanButton() {
  const [state, setState] = useState<"idle" | "running" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function runScan() {
    setState("running");
    setMessage("");
    const response = await fetch("/api/scans/run", { method: "POST" });
    const payload = (await response.json()) as { error?: string; status?: string };
    if (!response.ok) {
      setState("error");
      setMessage(payload.error ?? "Scan failed");
      return;
    }
    setState("done");
    setMessage(`Scan finished: ${payload.status}`);
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={runScan}
        disabled={state === "running"}
        className="rounded bg-accent px-4 py-2 text-sm font-semibold text-black disabled:opacity-60"
      >
        {state === "running" ? "Scanning..." : "Run Scan Now"}
      </button>
      {message ? <p className="text-xs text-zinc-400">{message}</p> : null}
    </div>
  );
}
