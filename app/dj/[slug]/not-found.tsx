import Link from "next/link";

export default function DjNotFound() {
  return (
    <main className="mx-auto max-w-xl px-6 py-24 text-center">
      <h1 className="text-3xl font-bold">DJ not found</h1>
      <p className="mt-4 text-sm opacity-80">
        This DJ profile doesn’t exist or isn’t published yet.
      </p>

      <div className="mt-8 flex items-center justify-center gap-4">
        <Link
          href="/djs"
          className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-black hover:text-white"
        >
          Browse DJs
        </Link>

        <Link
          href="/"
          className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-black hover:text-white"
        >
          Go home
        </Link>
      </div>
    </main>
  );
}
