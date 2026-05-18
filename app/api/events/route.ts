import { NextResponse } from "next/server";
import { getEventsData } from "@/lib/data";

export async function GET() {
  return NextResponse.json(await getEventsData());
}
