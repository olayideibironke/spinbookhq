import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type DjProfile = Record<string, unknown>;

function valueToString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function valueToNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function pickId(dj: DjProfile) {
  return (
    valueToString(dj.user_id) ||
    valueToString(dj.id) ||
    valueToString(dj.slug) ||
    Math.random().toString()
  );
}

function pickName(dj: DjProfile) {
  return (
    valueToString(dj.stage_name) ||
    valueToString(dj.display_name) ||
    valueToString(dj.dj_name) ||
    valueToString(dj.full_name) ||
    valueToString(dj.slug) ||
    "DJ"
  );
}

function pickLocation(dj: DjProfile) {
  return (
    valueToString(dj.city) ||
    valueToString(dj.location) ||
    valueToString(dj.market) ||
    "Available for events"
  );
}

function pickSlug(dj: DjProfile) {
  return valueToString(dj.slug);
}

function pickPhoto(dj: DjProfile) {
  return (
    valueToString(dj.avatar_url) ||
    valueToString(dj.photo_url) ||
    valueToString(dj.profile_photo_url) ||
    valueToString(dj.image_url) ||
    valueToString(dj.cover_photo_url)
  );
}

function pickPrice(dj: DjProfile) {
  const price =
    valueToNumber(dj.starting_price) ??
    valueToNumber(dj.from_price) ??
    valueToNumber(dj.base_price);

  if (price && price > 0) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(price);
  }

  return "View pricing";
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "D") + (parts[1]?.[0] ?? "")).toUpperCase();
}

export default async function BrowseDjsPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("dj_profiles")
    .select("*")
    .order("updated_at", { ascending: false });

  const djs = ((data ?? []) as DjProfile[]).filter((dj) => {
    const slug = pickSlug(dj);
    const name = pickName(dj);
    return slug && name;
  });

  return (
    <main className="min-h-screen bg-black px-6 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-[0.22em] text-white/60">
              DJ MARKETPLACE
            </p>
            <h1 className="mt-1 text-3xl font-extrabold text-white">
              Browse DJs for your next event.
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-white/65">
              Explore live DJ profiles, photos, starting prices, and booking
              availability in select launch markets.
            </p>
          </div>

          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-extrabold text-white/85 hover:bg-white/[0.08]"
          >
            Back to Home →
          </Link>
        </div>

        <section className="mt-10">
          {djs.length ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {djs.map((dj) => {
                const name = pickName(dj);
                const slug = pickSlug(dj);
                const photo = pickPhoto(dj);

                return (
                  <Link
                    key={pickId(dj)}
                    href={`/dj/${slug}`}
                    className="group overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-[0_18px_60px_rgba(0,0,0,0.45)] transition hover:border-white/20 hover:bg-white/[0.07]"
                  >
                    <div className="relative h-56 overflow-hidden bg-white/[0.03]">
                      {photo ? (
                        <img
                          src={photo}
                          alt={name}
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-violet-950/70 via-black to-fuchsia-950/50">
                          <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-white/10 bg-black/40 text-xl font-extrabold text-white">
                            {initials(name)}
                          </div>
                        </div>
                      )}

                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

                      <div className="absolute bottom-4 left-4 right-4">
                        <h2 className="truncate text-xl font-extrabold text-white">
                          {name}
                        </h2>
                        <p className="mt-1 truncate text-sm text-white/75">
                          {pickLocation(dj)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-5">
                      <p className="text-sm font-semibold text-white/75">
                        From {pickPrice(dj)}
                      </p>

                      <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs font-bold text-white/80 group-hover:bg-white/10">
                        View profile
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-white/70">
              No live DJ profiles are available yet.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}