import { env } from "@/lib/env";
import { loginAction } from "@/app/actions";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  const devOpen = !env.APP_PASSWORD && env.NODE_ENV !== "production";
  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <form action={loginAction} className="w-full max-w-sm rounded-lg border border-line bg-panel p-6">
        <h1 className="text-2xl font-semibold">Bracket Watch</h1>
        <p className="mt-2 text-sm text-zinc-400">Private scouting dashboard for Gi / Male / Master 2 / Black / Light Feather.</p>
        {devOpen ? (
          <p className="mt-4 rounded border border-accent/40 bg-accent/10 p-3 text-sm text-accent">
            APP_PASSWORD is not set. Development login accepts any password.
          </p>
        ) : null}
        {params.error ? <p className="mt-4 text-sm text-red-300">Wrong password.</p> : null}
        <label className="mt-5 block text-sm text-zinc-300">
          Password
          <input name="password" type="password" className="mt-2 w-full rounded border border-line px-3 py-2" autoFocus />
        </label>
        <button className="mt-5 w-full rounded bg-accent px-4 py-2 font-semibold text-black">Enter</button>
      </form>
    </main>
  );
}
