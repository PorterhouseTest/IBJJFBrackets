import { z } from "zod";
import { USER_AGENT } from "@/lib/constants";
import { env, isMockMode } from "@/lib/env";
import linksFixture from "@/mock/registration-links.json";
import categoriesFixture from "@/mock/categories.json";
import competitorsFixture from "@/mock/competitors.json";
import topFixture from "@/mock/top-page-1.json";

export type WatchProfileInput = {
  gi: boolean;
  gender: string;
  age: string;
  belt: string;
  weight: string;
  exactDivision: string;
};

export const registrationLinksSchema = z.object({
  links: z.array(z.object({ name: z.string(), link: z.string() }))
});

export const categoriesSchema = z.object({
  categories: z.array(z.string()),
  event_name: z.string(),
  total_competitors: z.number().optional().default(0)
});

export const competitorSchema = z.object({
  name: z.string(),
  team: z.string().nullable().optional(),
  id: z.union([z.string(), z.number()]).nullable().optional(),
  slug: z.string().nullable().optional(),
  instagram_profile: z.string().nullable().optional(),
  personal_name: z.string().nullable().optional(),
  profile_image_url: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  age: z.string().nullable().optional(),
  belt: z.string().nullable().optional(),
  weight: z.string().nullable().optional(),
  gender: z.string().nullable().optional(),
  gi: z.boolean().nullable().optional(),
  rating: z.number().nullable().optional(),
  match_count: z.number().nullable().optional(),
  rank: z.number().nullable().optional(),
  percentile: z.number().nullable().optional(),
  seed: z.number().nullable().optional(),
  ordinal: z.number().nullable().optional()
});

export const competitorsSchema = z.object({
  competitors: z.array(competitorSchema),
  side_swaps: z.unknown().optional(),
  side_swap_bailout_teams: z.unknown().optional()
});

export const topRegistrationSchema = z.object({
  event_name: z.string(),
  division: z.string(),
  event_start_date: z.string().nullable().optional(),
  event_end_date: z.string().nullable().optional(),
  link: z.string().nullable().optional(),
  event_id: z.union([z.string(), z.number()]).nullable().optional()
});

export const topRowSchema = z.object({
  rank: z.number().nullable().optional(),
  athlete_id: z.union([z.string(), z.number()]).nullable().optional(),
  name: z.string(),
  slug: z.string().nullable().optional(),
  instagram_profile: z.string().nullable().optional(),
  personal_name: z.string().nullable().optional(),
  profile_image_url: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  rating: z.number().nullable().optional(),
  match_count: z.number().nullable().optional(),
  previous_rating: z.number().nullable().optional(),
  previous_rank: z.number().nullable().optional(),
  registrations: z.array(topRegistrationSchema).optional().default([])
});

export const topPageSchema = z.object({
  rows: z.array(topRowSchema),
  totalPages: z.number().int().min(1).optional().default(1)
});

export type RegistrationLink = z.infer<typeof registrationLinksSchema>["links"][number];
export type RegistrationCategories = z.infer<typeof categoriesSchema>;
export type RegistrationCompetitor = z.infer<typeof competitorSchema>;
export type TopRow = z.infer<typeof topRowSchema>;

let requestCount = 0;

export function getJiuJitsuRequestCount() {
  return requestCount;
}

export function resetJiuJitsuRequestCount() {
  requestCount = 0;
}

export function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function normalizeDivision(input: string) {
  return input
    .split("/")
    .map((part) => part.trim().replace(/\s+/g, " "))
    .filter(Boolean)
    .join(" / ");
}

export function parseDivisionString(division: string) {
  const [belt, age, gender, weight] = normalizeDivision(division).split(" / ");
  return { belt, age, gender, weight };
}

function asString(value: string | number | null | undefined) {
  return value == null ? null : String(value);
}

export function toAthleteId(value: string | number | null | undefined) {
  return asString(value);
}

function buildUrl(path: string, params?: URLSearchParams) {
  const url = new URL(path, env.JIUJITSU_BASE_URL);
  if (params) {
    params.forEach((value, key) => url.searchParams.set(key, value));
  }
  return url;
}

export async function fetchWithRetry(url: URL, options: RequestInit = {}, attempts = 4): Promise<unknown> {
  let lastError: Error | null = null;
  for (let index = 0; index < attempts; index += 1) {
    requestCount += 1;
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          Accept: "application/json",
          "User-Agent": USER_AGENT,
          ...options.headers
        },
        cache: "no-store"
      });
      if (response.ok) return response.json();
      if (![429, 500, 502, 503, 504].includes(response.status)) {
        throw new Error(`JiuJitsu.net request failed ${response.status} for ${url.pathname}`);
      }
      lastError = new Error(`Retriable JiuJitsu.net failure ${response.status} for ${url.pathname}`);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }
    await delay(500 * 2 ** index);
  }
  throw lastError ?? new Error(`JiuJitsu.net request failed for ${url.pathname}`);
}

export async function fetchRegistrationLinks() {
  if (isMockMode()) return registrationLinksSchema.parse(linksFixture).links;
  const payload = await fetchWithRetry(buildUrl("/api/brackets/registrations/links"));
  return registrationLinksSchema.parse(payload).links;
}

export async function fetchRegistrationCategories(link: string) {
  if (isMockMode()) return categoriesSchema.parse(categoriesFixture);
  const params = new URLSearchParams({ link });
  const payload = await fetchWithRetry(buildUrl("/api/brackets/registrations/categories", params));
  return categoriesSchema.parse(payload);
}

export async function fetchRegistrationCompetitors(link: string, division: string, gi: boolean) {
  if (isMockMode()) return competitorsSchema.parse(competitorsFixture).competitors;
  const params = new URLSearchParams({ link, division, gi: String(gi) });
  const payload = await fetchWithRetry(buildUrl("/api/brackets/registrations/competitors", params));
  return competitorsSchema.parse(payload).competitors;
}

export async function fetchTopPage(profile: WatchProfileInput, page: number) {
  if (isMockMode()) return topPageSchema.parse(topFixture);
  const params = new URLSearchParams({
    gender: profile.gender,
    age: profile.age,
    belt: profile.belt,
    weight: profile.weight,
    gi: String(profile.gi),
    upcoming: "true",
    page: String(page)
  });
  const payload = await fetchWithRetry(buildUrl("/api/top", params));
  return topPageSchema.parse(payload);
}

export async function fetchAllRadarAthletes(profile: WatchProfileInput) {
  const first = await fetchTopPage(profile, 1);
  const rows = [...first.rows];
  for (let page = 2; page <= first.totalPages; page += 1) {
    const next = await fetchTopPage(profile, page);
    rows.push(...next.rows);
  }
  return rows;
}
