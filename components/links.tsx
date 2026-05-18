import { env } from "@/lib/env";

export function athleteUrl(slug: string | null) {
  return slug ? `${env.JIUJITSU_BASE_URL}/athlete/${encodeURIComponent(slug)}` : null;
}

export function externalUrl(path: string | null) {
  if (!path) return null;
  try {
    return new URL(path, env.JIUJITSU_BASE_URL).toString();
  } catch {
    return path;
  }
}

export function countryFlag(country: string | null) {
  if (!country || country.length !== 2) return country ?? "n/a";
  const codePoints = country
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}
