"use server";

import { revalidatePath } from "next/cache";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

export async function updateProfileAction(formData: FormData) {
  if (!env.DATABASE_URL) return;
  const id = String(formData.get("id"));
  const gi = formData.get("gi") === "on";
  const belt = String(formData.get("belt"));
  const age = String(formData.get("age"));
  const gender = String(formData.get("gender"));
  const weight = String(formData.get("weight"));
  await prisma.watchProfile.update({
    where: { id },
    data: {
      name: String(formData.get("name")),
      gi,
      gender,
      age,
      belt,
      weight,
      exactDivision: `${belt} / ${age} / ${gender} / ${weight}`,
      alertEmailEnabled: formData.get("alertEmailEnabled") === "on"
    }
  });
  revalidatePath("/");
  revalidatePath("/settings");
}
