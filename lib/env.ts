import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().optional(),
  JIUJITSU_BASE_URL: z.string().url().default("https://jiujitsu.net"),
  CRON_SECRET: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  ALERT_EMAIL_TO: z.string().email().optional(),
  ALERT_EMAIL_FROM: z.string().email().optional(),
  MOCK_JIUJITSU: z.string().optional(),
  SEND_NO_CHANGE_EMAIL: z.string().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NODE_ENV: z.enum(["development", "production", "test"]).optional()
});

export const env = envSchema.parse(process.env);

export function isMockMode() {
  return env.MOCK_JIUJITSU === "true";
}

export function emailConfigured() {
  return Boolean(env.RESEND_API_KEY && env.ALERT_EMAIL_TO && env.ALERT_EMAIL_FROM);
}
