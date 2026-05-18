import { NextResponse } from "next/server";
import { isLoggedIn } from "@/lib/auth";
import { getAthletesData } from "@/lib/data";

export async function GET() {
  if (!(await isLoggedIn())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(await getAthletesData());
}
