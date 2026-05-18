import type { WatchProfile } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { TARGET_DIVISION } from "@/lib/constants";
import { diffSnapshots } from "@/lib/diff";
import { sendChangeEmail } from "@/lib/email";
import {
  delay,
  fetchAllRadarAthletes,
  fetchRegistrationCategories,
  fetchRegistrationCompetitors,
  fetchRegistrationLinks,
  getJiuJitsuRequestCount,
  normalizeDivision,
  resetJiuJitsuRequestCount,
  toAthleteId
} from "@/lib/jiujitsu";
import { env } from "@/lib/env";

function toDate(value?: string | null) {
  return value ? new Date(value) : null;
}

function politeDelayMs() {
  if (env.MOCK_JIUJITSU === "true") return 10;
  return 500 + Math.floor(Math.random() * 501);
}

async function getProfile(profileId?: string) {
  const profile = profileId
    ? await prisma.watchProfile.findUnique({ where: { id: profileId } })
    : await prisma.watchProfile.findFirst({ where: { active: true }, orderBy: { createdAt: "asc" } });
  if (profile) return profile;
  return prisma.watchProfile.create({
    data: {
      id: "default-watch-profile",
      name: "Mikey - Gi Male Master 2 Black Light Feather",
      gi: true,
      gender: "Male",
      age: "Master 2",
      belt: "BLACK",
      weight: "Light Feather",
      exactDivision: TARGET_DIVISION,
      alertEmailEnabled: true,
      active: true
    }
  });
}

async function previousSuccessfulRun(profile: WatchProfile, currentRunId: string) {
  return prisma.scanRun.findFirst({
    where: {
      watchProfileId: profile.id,
      status: { in: ["SUCCESS", "PARTIAL_SUCCESS"] },
      id: { not: currentRunId }
    },
    orderBy: { startedAt: "desc" },
    include: { events: true, competitors: true }
  });
}

export async function runDailyScan(profileId?: string) {
  resetJiuJitsuRequestCount();
  const profile = await getProfile(profileId);
  const scanRun = await prisma.scanRun.create({
    data: {
      watchProfileId: profile.id,
      status: "RUNNING",
      sourceBaseUrl: env.JIUJITSU_BASE_URL
    }
  });

  const errors: string[] = [];

  try {
    const links = await fetchRegistrationLinks();
    for (const registration of links) {
      await delay(politeDelayMs());
      try {
        const categoryPayload = await fetchRegistrationCategories(registration.link);
        const hasExact = categoryPayload.categories.map(normalizeDivision).includes(normalizeDivision(profile.exactDivision));
        if (!hasExact) continue;

        await delay(politeDelayMs());
        const competitors = await fetchRegistrationCompetitors(registration.link, profile.exactDivision, profile.gi);
        const event = await prisma.eventSnapshot.create({
          data: {
            scanRunId: scanRun.id,
            watchProfileId: profile.id,
            eventName: categoryPayload.event_name || registration.name,
            registrationLink: registration.link,
            exactDivisionPresent: true,
            competitorCount: competitors.length
          }
        });

        for (const competitor of competitors) {
          await prisma.competitorSnapshot.upsert({
            where: {
              scanRunId_sourceType_athleteName_eventName_registeredDivision: {
                scanRunId: scanRun.id,
                sourceType: "EXACT_DIVISION",
                athleteName: competitor.name,
                eventName: event.eventName,
                registeredDivision: profile.exactDivision
              }
            },
            update: {},
            create: {
              scanRunId: scanRun.id,
              eventSnapshotId: event.id,
              watchProfileId: profile.id,
              sourceType: "EXACT_DIVISION",
              athleteName: competitor.name,
              personalName: competitor.personal_name,
              team: competitor.team,
              country: competitor.country,
              instagram: competitor.instagram_profile,
              profileImageUrl: competitor.profile_image_url,
              athleteId: toAthleteId(competitor.id),
              slug: competitor.slug,
              rating: competitor.rating,
              rank: competitor.rank,
              matchCount: competitor.match_count,
              percentile: competitor.percentile,
              seed: competitor.seed,
              ordinal: competitor.ordinal,
              registeredDivision: profile.exactDivision,
              eventName: event.eventName,
              registrationLink: registration.link
            }
          });
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        errors.push(`${registration.name}: ${message}`);
      }
    }

    const radarRows = await fetchAllRadarAthletes(profile);
    for (const row of radarRows) {
      for (const registration of row.registrations) {
        await prisma.competitorSnapshot.upsert({
          where: {
            scanRunId_sourceType_athleteName_eventName_registeredDivision: {
              scanRunId: scanRun.id,
              sourceType: "RADAR",
              athleteName: row.name,
              eventName: registration.event_name,
              registeredDivision: registration.division
            }
          },
          update: {},
          create: {
            scanRunId: scanRun.id,
            watchProfileId: profile.id,
            sourceType: "RADAR",
            athleteName: row.name,
            personalName: row.personal_name,
            country: row.country,
            instagram: row.instagram_profile,
            profileImageUrl: row.profile_image_url,
            athleteId: toAthleteId(row.athlete_id),
            slug: row.slug,
            rating: row.rating,
            rank: row.rank,
            matchCount: row.match_count,
            registeredDivision: registration.division,
            eventName: registration.event_name,
            eventStartDate: toDate(registration.event_start_date),
            eventEndDate: toDate(registration.event_end_date),
            registrationLink: registration.link ?? undefined,
            eventId: toAthleteId(registration.event_id) ?? undefined
          }
        });
      }
    }

    const currentEvents = await prisma.eventSnapshot.findMany({ where: { scanRunId: scanRun.id } });
    const currentCompetitors = await prisma.competitorSnapshot.findMany({ where: { scanRunId: scanRun.id } });
    const previous = await previousSuccessfulRun(profile, scanRun.id);
    const changeDrafts = previous
      ? diffSnapshots(
          previous.events.map((event) => ({ eventName: event.eventName, registrationLink: event.registrationLink })),
          currentEvents.map((event) => ({ eventName: event.eventName, registrationLink: event.registrationLink })),
          previous.competitors.map((item) => ({
            sourceType: item.sourceType,
            athleteName: item.athleteName,
            eventName: item.eventName,
            registeredDivision: item.registeredDivision,
            team: item.team
          })),
          currentCompetitors.map((item) => ({
            sourceType: item.sourceType,
            athleteName: item.athleteName,
            eventName: item.eventName,
            registeredDivision: item.registeredDivision,
            team: item.team
          }))
        )
      : [];

    const createdChanges =
      changeDrafts.length > 0
        ? await prisma.$transaction(
            changeDrafts.map((change) =>
              prisma.changeLog.create({
                data: {
                  ...change,
                  metadata: change.metadata ?? undefined,
                  watchProfileId: profile.id,
                  scanRunId: scanRun.id
                }
              })
            )
          )
        : [];

    const exactCompetitorsFound = currentCompetitors.filter((item) => item.sourceType === "EXACT_DIVISION").length;
    const radarAthletesFound = new Set(
      currentCompetitors.filter((item) => item.sourceType === "RADAR").map((item) => item.athleteName)
    ).size;
    const finalRun = await prisma.scanRun.update({
      where: { id: scanRun.id },
      data: {
        finishedAt: new Date(),
        status: errors.length > 0 ? "PARTIAL_SUCCESS" : "SUCCESS",
        exactEventsFound: currentEvents.length,
        exactCompetitorsFound,
        radarAthletesFound,
        requestsMade: getJiuJitsuRequestCount(),
        errorMessage: errors.length > 0 ? errors.join("\n") : null,
        rawSummary: {
          linksScanned: links.length,
          changes: createdChanges.length,
          errors
        }
      }
    });

    if (profile.alertEmailEnabled) await sendChangeEmail(createdChanges);
    return finalRun;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await prisma.changeLog.create({
      data: {
        watchProfileId: profile.id,
        scanRunId: scanRun.id,
        changeType: "ERROR",
        severity: "CRITICAL",
        title: "Scan failed",
        description: message
      }
    });
    return prisma.scanRun.update({
      where: { id: scanRun.id },
      data: {
        finishedAt: new Date(),
        status: "FAILED",
        requestsMade: getJiuJitsuRequestCount(),
        errorMessage: message
      }
    });
  }
}
