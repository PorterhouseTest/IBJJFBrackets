import { NextResponse } from "next/server";
import { MANUAL_SCAN_INTERVAL_MS } from "@/lib/constants";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { runDailyScan } from "@/lib/scanner";

export async function POST() {
  if (!env.DATABASE_URL) return NextResponse.json({ error: "DATABASE_URL is not configured." }, { status: 503 });
  const latestManualLikeRun = await prisma.scanRun.findFirst({
    orderBy: { startedAt: "desc" }
  });
  if (latestManualLikeRun && Date.now() - latestManualLikeRun.startedAt.getTime() < MANUAL_SCAN_INTERVAL_MS) {
    return NextResponse.json({ error: "Manual scan is rate-limited to once every 10 minutes." }, { status: 429 });
  }
  const run = await runDailyScan();
  return NextResponse.json({
    id: run.id,
    status: run.status,
    exactEventsFound: run.exactEventsFound,
    exactCompetitorsFound: run.exactCompetitorsFound,
    radarAthletesFound: run.radarAthletesFound,
    requestsMade: run.requestsMade,
    errorMessage: run.errorMessage
  });
}
