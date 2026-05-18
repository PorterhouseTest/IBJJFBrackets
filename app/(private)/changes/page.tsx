import { format } from "date-fns";
import { Card, Badge } from "@/components/ui";
import { getChangesData } from "@/lib/data";

export default async function ChangesPage() {
  const changes = await getChangesData();
  const groups = new Map<string, typeof changes>();
  for (const change of changes) {
    const key = format(change.createdAt, "MMM d, yyyy");
    groups.set(key, [...(groups.get(key) ?? []), change]);
  }
  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-semibold">Changes</h1>
      {[...groups.entries()].map(([date, items]) => (
        <Card key={date}>
          <h2 className="font-semibold text-zinc-300">{date}</h2>
          <div className="mt-3 space-y-3">
            {items.map((change) => (
              <div key={change.id} className="border-t border-line pt-3">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{change.title}</p>
                  <Badge tone={change.severity === "IMPORTANT" || change.severity === "CRITICAL" ? "accent" : "default"}>{change.changeType}</Badge>
                </div>
                <p className="mt-1 text-sm text-zinc-400">{change.description}</p>
              </div>
            ))}
          </div>
        </Card>
      ))}
      {changes.length === 0 ? <p className="text-sm text-zinc-500">No changes have been logged yet.</p> : null}
    </div>
  );
}
