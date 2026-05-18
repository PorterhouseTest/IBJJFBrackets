import { Resend } from "resend";
import type { ChangeLog } from "@prisma/client";
import { emailConfigured, env } from "@/lib/env";

export async function sendChangeEmail(changes: ChangeLog[]) {
  if (!emailConfigured()) return;
  if (changes.length === 0 && env.SEND_NO_CHANGE_EMAIL !== "true") return;

  const important = changes.filter((change) => change.severity !== "INFO");
  const subject =
    important.length > 0
      ? `Bracket Watch: ${important.length} important change${important.length === 1 ? "" : "s"} found`
      : changes.length > 0
        ? `Bracket Watch: ${changes.length} radar update${changes.length === 1 ? "" : "s"}`
        : "Bracket Watch: no exact division changes";

  const dashboardUrl = env.NEXT_PUBLIC_APP_URL ?? "your Bracket Watch dashboard";
  const body =
    changes.length === 0
      ? `No exact division changes were found.\n\nDashboard: ${dashboardUrl}`
      : [
          "Exact division changes:",
          ...changes
            .filter((change) => change.changeType !== "NEW_RADAR_ATHLETE" && change.changeType !== "REMOVED_RADAR_ATHLETE")
            .map((change) => `- ${change.title}: ${change.description}`),
          "",
          "Radar changes:",
          ...changes
            .filter((change) => change.changeType === "NEW_RADAR_ATHLETE" || change.changeType === "REMOVED_RADAR_ATHLETE")
            .map((change) => `- ${change.title}: ${change.description}`),
          "",
          `Dashboard: ${dashboardUrl}`
        ].join("\n");

  const resend = new Resend(env.RESEND_API_KEY);
  await resend.emails.send({
    from: env.ALERT_EMAIL_FROM!,
    to: env.ALERT_EMAIL_TO!,
    subject,
    text: body
  });
}
