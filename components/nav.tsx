import Link from "next/link";
import { logoutAction } from "@/app/actions";

const links = [
  ["/", "Dashboard"],
  ["/events", "Events"],
  ["/athletes", "Athletes"],
  ["/changes", "Changes"],
  ["/settings", "Settings"]
] as const;

export function Nav() {
  return (
    <header className="border-b border-line bg-canvas/95">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link href="/" className="font-semibold tracking-wide">
          Bracket <span className="text-accent">Watch</span>
        </Link>
        <nav className="flex flex-wrap items-center gap-3 text-sm text-zinc-300">
          {links.map(([href, label]) => (
            <Link key={href} href={href} className="hover:text-white">
              {label}
            </Link>
          ))}
          <form action={logoutAction}>
            <button className="rounded border border-line px-3 py-1 text-xs hover:border-accent">Log out</button>
          </form>
        </nav>
      </div>
    </header>
  );
}
