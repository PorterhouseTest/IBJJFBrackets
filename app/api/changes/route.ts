import { NextResponse } from "next/server";
import { getChangesData } from "@/lib/data";

export async function GET() {
  return NextResponse.json(await getChangesData());
}
