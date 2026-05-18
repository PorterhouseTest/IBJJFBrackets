import { Nav } from "@/components/nav";
import { requireAuth } from "@/lib/auth";

export default async function PrivateLayout({ children }: { children: React.ReactNode }) {
  await requireAuth();
  return (
    <>
      <Nav />
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
    </>
  );
}
