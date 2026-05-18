import { addDays } from "date-fns";
import { prisma } from "@/lib/prisma";

export async function getActiveProfile() {
  return prisma.watchProfile.findFirst({ where: { active: true }, orderBy: { createdAt: "asc" } });
}

export async function getLatestSuccessfulRun() {
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
    profile,
    latest,
    nextScan: latest?.startedAt ? addDays(latest.startedAt, 1) : null,
    changes,
    exactCompetitors,
    radarCompetitors
  };
}

export async function getEventsData() {
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
  const latest = await getLatestSuccessfulRun();
  if (!latest) return [];
  const competitors = await prisma.competitorSnapshot.findMany({
    where: { scanRunId: latest.id },
    orderBy: [{ athleteName: "asc" }, { eventStartDate: "asc" }]
  });
  return competitors;
}

export async function getChangesData() {
  return prisma.changeLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100
  });
}
