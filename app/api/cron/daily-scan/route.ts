import { NextRequest, NextResponse } from "next/server";
import { runDailyScan } from "@/lib/scanner";
import { env } from "@/lib/env";

export async function GET(request: NextRequest) {
  if (!env.DATABASE_URL) return NextResponse.json({ error: "DATABASE_URL is not configured." }, { status: 503 });
  const userAgent = request.headers.get("user-agent") ?? "";
  const auth = request.headers.get("authorization");
  const cronSecretOk = env.CRON_SECRET ? auth === `Bearer ${env.CRON_SECRET}` : false;
  const vercelCronOk = userAgent.includes("vercel-cron/1.0");

  if (env.CRON_SECRET && !cronSecretOk && !vercelCronOk) {
    return NextResponse.json({ error: "Unauthorized cron request" }, { status: 401 });
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
