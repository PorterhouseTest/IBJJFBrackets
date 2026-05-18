import { NextResponse } from "next/server";
import { runLiveScan } from "@/lib/live-scan";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    return NextResponse.json(await runLiveScan());
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Live scan failed"
      },
      { status: 500 }
    );
  }
}
