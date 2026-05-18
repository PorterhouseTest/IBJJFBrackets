import { NextResponse } from "next/server";
import { runLiveScan } from "@/lib/live-scan";
import { TARGET_DIVISION } from "@/lib/constants";
import { parseDivisionString } from "@/lib/jiujitsu";

export const dynamic = "force-dynamic";

const defaultParts = parseDivisionString(TARGET_DIVISION);

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as Partial<{
      gi: boolean;
      gender: string;
      age: string;
      belt: string;
      weight: string;
    }>;
    const profile = {
      gi: body.gi ?? true,
      gender: body.gender ?? defaultParts.gender,
      age: body.age ?? defaultParts.age,
      belt: body.belt ?? defaultParts.belt,
      weight: body.weight ?? defaultParts.weight,
      exactDivision: `${body.belt ?? defaultParts.belt} / ${body.age ?? defaultParts.age} / ${body.gender ?? defaultParts.gender} / ${body.weight ?? defaultParts.weight}`
    };
    return NextResponse.json(await runLiveScan(profile));
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Live scan failed"
      },
      { status: 500 }
    );
  }
}
