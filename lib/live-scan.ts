import { TARGET_DIVISION } from "@/lib/constants";
import {
  fetchAllRadarAthletes,
  fetchRegistrationCategories,
  fetchRegistrationCompetitors,
  fetchRegistrationLinks,
  getJiuJitsuRequestCount,
  normalizeDivision,
  resetJiuJitsuRequestCount,
  type RegistrationCompetitor,
  type WatchProfileInput
} from "@/lib/jiujitsu";

const defaultProfile: WatchProfileInput = {
  gi: true,
  gender: "Male",
  age: "Master 2",
  belt: "BLACK",
  weight: "Light Feather",
  exactDivision: TARGET_DIVISION
};

export type LiveExactEvent = {
  eventName: string;
  registrationLink: string;
  competitors: Array<RegistrationCompetitor & { registeredDivision: string; eventName: string; registrationLink: string }>;
};

export type LiveRadarAthlete = {
  athleteName: string;
  personalName: string | null;
  country: string | null;
  instagram: string | null;
  slug: string | null;
  rating: number | null;
  rank: number | null;
  matchCount: number | null;
  eventName: string;
  registeredDivision: string;
  registrationLink: string | null;
  eventStartDate: string | null;
  eventEndDate: string | null;
};

export type LiveScanResult = {
  scannedAt: string;
  exactDivision: string;
  exactEventsFound: number;
  exactCompetitorsFound: number;
  radarAthletesFound: number;
  requestsMade: number;
  exactEvents: LiveExactEvent[];
  radarAthletes: LiveRadarAthlete[];
  errors: string[];
};

export async function runLiveScan(profile = defaultProfile): Promise<LiveScanResult> {
  resetJiuJitsuRequestCount();
  const errors: string[] = [];
  const exactEvents: LiveExactEvent[] = [];
  const links = await fetchRegistrationLinks();

  for (const registration of links) {
    try {
      const categories = await fetchRegistrationCategories(registration.link);
      const hasExact = categories.categories.map(normalizeDivision).includes(normalizeDivision(profile.exactDivision));
      if (!hasExact) continue;

      const competitors = await fetchRegistrationCompetitors(registration.link, profile.exactDivision, profile.gi);
      exactEvents.push({
        eventName: categories.event_name || registration.name,
        registrationLink: registration.link,
        competitors: competitors.map((competitor) => ({
          ...competitor,
          registeredDivision: profile.exactDivision,
          eventName: categories.event_name || registration.name,
          registrationLink: registration.link
        }))
      });
    } catch (error) {
      errors.push(`${registration.name}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  const radarRows = await fetchAllRadarAthletes(profile);
  const radarAthletes = radarRows.flatMap((row) =>
    row.registrations.map((registration) => ({
      athleteName: row.name,
      personalName: row.personal_name ?? null,
      country: row.country ?? null,
      instagram: row.instagram_profile ?? null,
      slug: row.slug ?? null,
      rating: row.rating ?? null,
      rank: row.rank ?? null,
      matchCount: row.match_count ?? null,
      eventName: registration.event_name,
      registeredDivision: registration.division,
      registrationLink: registration.link ?? null,
      eventStartDate: registration.event_start_date ?? null,
      eventEndDate: registration.event_end_date ?? null
    }))
  );

  return {
    scannedAt: new Date().toISOString(),
    exactDivision: profile.exactDivision,
    exactEventsFound: exactEvents.length,
    exactCompetitorsFound: exactEvents.reduce((sum, event) => sum + event.competitors.length, 0),
    radarAthletesFound: new Set(radarAthletes.map((athlete) => athlete.athleteName)).size,
    requestsMade: getJiuJitsuRequestCount(),
    exactEvents,
    radarAthletes,
    errors
  };
}
