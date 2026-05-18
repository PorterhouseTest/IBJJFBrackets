import { Nav } from "@/components/nav";

export default async function PrivateLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Nav />
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
    </>
  );
}
