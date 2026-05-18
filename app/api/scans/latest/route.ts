import { NextResponse } from "next/server";
import { getLatestSuccessfulRun } from "@/lib/data";

export async function GET() {
  return NextResponse.json(await getLatestSuccessfulRun());
}
