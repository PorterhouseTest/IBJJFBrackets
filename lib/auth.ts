import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { randomBytes, createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";

const COOKIE_NAME = "bracket_watch_session";

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession() {
  const token = randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  await prisma.userSession.create({
    data: {
      tokenHash,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
    }
  });
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (token) await prisma.userSession.deleteMany({ where: { tokenHash: hashToken(token) } });
  cookieStore.delete(COOKIE_NAME);
}

export async function isLoggedIn() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return false;
  const session = await prisma.userSession.findUnique({ where: { tokenHash: hashToken(token) } });
  return Boolean(session && session.expiresAt > new Date());
}

export async function requireAuth() {
  if (!(await isLoggedIn())) redirect("/login");
}

export function passwordAllowed(password: string) {
  if (!env.APP_PASSWORD && env.NODE_ENV !== "production") return true;
  if (!env.APP_PASSWORD) return false;
  return password === env.APP_PASSWORD;
}
