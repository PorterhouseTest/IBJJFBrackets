import { addDays } from "date-fns";
import { prisma } from "@/lib/prisma";
import { DEFAULT_PROFILE_ID, TARGET_DIVISION } from "@/lib/constants";
import { env } from "@/lib/env";

export function databaseConfigured() {
  return Boolean(env.DATABASE_URL);
}

function fallbackProfile() {
  return {
    id: DEFAULT_PROFILE_ID,
    name: "Mikey - Gi Male Master 2 Black Light Feather",
    gi: true,
    gender: "Male",
    age: "Master 2",
    belt: "BLACK",
    weight: "Light Feather",
    exactDivision: TARGET_DIVISION,
    alertEmailEnabled: true,
    active: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

export async function getActiveProfile() {
  if (!databaseConfigured()) return fallbackProfile();
  return prisma.watchProfile.findFirst({ where: { active: true }, orderBy: { createdAt: "asc" } });
}

export async function getLatestSuccessfulRun() {
  if (!databaseConfigured()) return null;
  return prisma.scanRun.findFirst({
    where: { status: { in: ["SUCCESS", "PARTIAL_SUCCESS"] } },
    orderBy: { startedAt: "desc" }
  });
}

export async function getDashboardData() {
  const profile = await getActiveProfile();
  const latest = await getLatestSuccessfulRun();
  const changes = latest
    ? await prisma.changeLog.findMany({ where: { scanRunId: latest.id }, orderBy: { createdAt: "desc" }, take: 8 })
    : [];
  const exactCompetitors = latest
    ? await prisma.competitorSnapshot.findMany({
        where: { scanRunId: latest.id, sourceType: "EXACT_DIVISION" },
        orderBy: [{ eventStartDate: "asc" }, { rating: "desc" }]
      })
    : [];
  const radarCompetitors = latest
    ? await prisma.competitorSnapshot.findMany({
        where: { scanRunId: latest.id, sourceType: "RADAR" },
        orderBy: [{ eventStartDate: "asc" }, { rating: "desc" }]
      })
    : [];
  return {
    databaseConfigured: databaseConfigured(),
    profile,
    latest,
    nextScan: latest?.startedAt ? addDays(latest.startedAt, 1) : null,
    changes,
    exactCompetitors,
    radarCompetitors
  };
}

export async function getEventsData() {
  if (!databaseConfigured()) return { latest: null, events: [], radar: [] };
  const latest = await getLatestSuccessfulRun();
  if (!latest) return { latest: null, events: [], radar: [] };
  const events = await prisma.eventSnapshot.findMany({
    where: { scanRunId: latest.id },
    include: { competitors: true },
    orderBy: [{ eventStartDate: "asc" }, { eventName: "asc" }]
  });
  const radar = await prisma.competitorSnapshot.findMany({
    where: { scanRunId: latest.id, sourceType: "RADAR" },
    orderBy: [{ eventStartDate: "asc" }, { rating: "desc" }]
  });
  return { latest, events, radar };
}

export async function getAthletesData() {
  if (!databaseConfigured()) return [];
  const latest = await getLatestSuccessfulRun();
  if (!latest) return [];
  const competitors = await prisma.competitorSnapshot.findMany({
    where: { scanRunId: latest.id },
    orderBy: [{ athleteName: "asc" }, { eventStartDate: "asc" }]
  });
  return competitors;
}

export async function getChangesData() {
  if (!databaseConfigured()) return [];
  return prisma.changeLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100
  });
}
