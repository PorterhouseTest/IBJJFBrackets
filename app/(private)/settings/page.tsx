import { updateProfileAction } from "@/app/actions";
import { ManualScanButton } from "@/components/manual-scan-button";
import { Card } from "@/components/ui";
import { databaseConfigured, getActiveProfile } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const profile = await getActiveProfile();
  if (!profile) return null;
  const hasDatabase = databaseConfigured();
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
      <Card>
        <h1 className="text-3xl font-semibold">Settings</h1>
        <form action={updateProfileAction} className="mt-5 grid gap-4 md:grid-cols-2">
          <input type="hidden" name="id" value={profile.id} />
          <label className="text-sm text-zinc-300">Name<input name="name" defaultValue={profile.name} className="mt-1 w-full rounded border border-line px-3 py-2" /></label>
          <label className="flex items-center gap-2 text-sm text-zinc-300"><input name="gi" type="checkbox" defaultChecked={profile.gi} /> Gi</label>
          <label className="text-sm text-zinc-300">Gender<input name="gender" defaultValue={profile.gender} className="mt-1 w-full rounded border border-line px-3 py-2" /></label>
          <label className="text-sm text-zinc-300">Age<input name="age" defaultValue={profile.age} className="mt-1 w-full rounded border border-line px-3 py-2" /></label>
          <label className="text-sm text-zinc-300">Belt<input name="belt" defaultValue={profile.belt} className="mt-1 w-full rounded border border-line px-3 py-2" /></label>
          <label className="text-sm text-zinc-300">Weight<input name="weight" defaultValue={profile.weight} className="mt-1 w-full rounded border border-line px-3 py-2" /></label>
          <label className="flex items-center gap-2 text-sm text-zinc-300"><input name="alertEmailEnabled" type="checkbox" defaultChecked={profile.alertEmailEnabled} /> Alert email enabled</label>
          <div className="md:col-span-2 rounded border border-line bg-black/20 p-3 text-sm text-zinc-400">
            Exact division is generated as Belt / Age / Gender / Weight.
          </div>
          {!hasDatabase ? (
            <div className="md:col-span-2 rounded border border-accent/50 bg-accent/10 p-3 text-sm text-accent">
              DATABASE_URL is not configured, so profile changes cannot be saved yet.
            </div>
          ) : null}
          <button disabled={!hasDatabase} className="rounded bg-accent px-4 py-2 font-semibold text-black disabled:opacity-50 md:w-fit">Save profile</button>
        </form>
      </Card>
      <Card>
        <h2 className="text-lg font-semibold">Manual scan</h2>
        <p className="mt-1 text-sm text-zinc-400">Manual scans are rate-limited to once every 10 minutes.</p>
        <div className="mt-4"><ManualScanButton /></div>
      </Card>
    </div>
  );
}
