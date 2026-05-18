import { NextResponse } from "next/server";
import { getAthletesData } from "@/lib/data";

export async function GET() {
  return NextResponse.json(await getAthletesData());
}
