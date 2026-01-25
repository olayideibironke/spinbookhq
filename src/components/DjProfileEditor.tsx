"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type DjProfile = {
  user_id: string;
  stage_name: string | null;
  city: string | null;
  bio: string | null;
  avatar_url: string | null;
  published: boolean | null;
  slug?: string | null;
};

function nonEmptyTrimmed(value: string) {
  const v = value.trim();
  return v.length > 0 ? v : "";
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    // replace & with "and"
    .replace(/&/g, " and ")
    // drop apostrophes
    .replace(/['’]/g, "")
    // non-alphanumeric to hyphen
    .replace(/[^a-z0-9]+/g, "-")
    // trim hyphens
    .replace(/^-+|-+$/g, "");
}

export default function DjProfileEditor({
  userId,
  userEmail,
  initialProfile,
}: {
  userId: string;
  userEmail: string;
  initialProfile: DjProfile | null;
}) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [stageName, setStageName] = useState(initialProfile?.stage_name ?? "");
  const [city, setCity] = useState(initialProfile?.city ?? "");
  const [bio, setBio] = useState(initialProfile?.bio ?? "");
  const [avatarUrl, setAvatarUrl] = useState(initialProfile?.avatar_url ?? "");
  const [published, setPublished] = useState<boolean>(
    Boolean(initialProfile?.published)
  );

  const hasProfile = Boolean(initialProfile?.user_id);

  const stageNameClean = nonEmptyTrimmed(stageName);
  const cityClean = nonEmptyTrimmed(city);
  const bioClean = nonEmptyTrimmed(bio);
  const avatarUrlClean = nonEmptyTrimmed(avatarUrl);

  // Required by DB constraints (based on your errors)
  const canSave = stageNameClean.length > 0;

  // slug: keep existing if present; otherwise derive from stage name
  const existingSlug = (initialProfile?.slug ?? "").trim();
  const derivedSlug = slugify(stageNameClean);
  const slugToUse = existingSlug.length > 0 ? existingSlug : derivedSlug;

  const canPublish = canSave; // minimal gate (we keep it low-friction)

  async function upsertProfile(nextPublished?: boolean) {
    setMsg(null);

    if (!canSave) {
      setMsg("Stage name is required.");
      return;
    }

    if (!slugToUse || slugToUse.length === 0) {
      setMsg("Could not generate a slug. Please adjust stage name.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        user_id: userId,
        stage_name: stageNameClean, // NOT NULL
        slug: slugToUse, // NOT NULL
        city: cityClean || null,
        bio: bioClean || null,
        avatar_url: avatarUrlClean || null,
        published: typeof nextPublished === "boolean" ? nextPublished : published,
      };

      const { error } = await supabase.from("dj_profiles").upsert(payload, {
        onConflict: "user_id",
      });

      if (error) throw error;

      setMsg("Saved ✅");
      router.refresh();
    } catch (e: any) {
      setMsg(e?.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function togglePublished() {
    if (!canPublish) {
      setMsg("Add a stage name before publishing.");
      return;
    }

    const next = !published;
    setPublished(next);
    await upsertProfile(next);
  }

  return (
    <div className="max-w-3xl rounded-2xl border p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Your DJ Profile</h2>
          <p className="text-sm opacity-70">Signed in as: {userEmail}</p>
        </div>

        <button
          type="button"
          className="rounded-md border px-3 py-2 text-sm font-medium"
          onClick={togglePublished}
          disabled={loading || !canPublish}
          title={
            !canPublish
              ? "Add a stage name before publishing"
              : "Controls whether you show up on the public /djs page"
          }
        >
          {loading
            ? "Working..."
            : published
            ? "Published ✅ (Click to Unpublish)"
            : "Unpublished ❌ (Click to Publish)"}
        </button>
      </div>

      <div className="mt-6 grid gap-4">
        <div className="grid gap-2">
          <label className="text-sm font-medium">Stage name</label>
          <input
            className="w-full rounded-md border px-3 py-2"
            value={stageName}
            onChange={(e) => setStageName(e.target.value)}
            placeholder="DJ iMean"
          />
          {!canSave ? (
            <p className="text-xs opacity-70">Stage name is required.</p>
          ) : null}
          {canSave ? (
            <p className="text-xs opacity-70">
              Public URL slug: <span className="font-mono">{slugToUse}</span>
            </p>
          ) : null}
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium">City</label>
          <input
            className="w-full rounded-md border px-3 py-2"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="DMV"
          />
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium">Bio</label>
          <textarea
            className="w-full rounded-md border px-3 py-2"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell clients what you play, your vibe, and your experience..."
            rows={4}
          />
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium">Avatar URL (optional)</label>
          <input
            className="w-full rounded-md border px-3 py-2"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder="https://..."
          />
        </div>

        {msg ? <p className="text-sm">{msg}</p> : null}

        <div className="flex gap-3">
          <button
            type="button"
            className="rounded-md border px-4 py-2 font-medium"
            onClick={() => upsertProfile()}
            disabled={loading || !canSave}
            title={!canSave ? "Stage name is required" : undefined}
          >
            {loading ? "Saving..." : hasProfile ? "Save changes" : "Save profile"}
          </button>
        </div>
      </div>
    </div>
  );
}
