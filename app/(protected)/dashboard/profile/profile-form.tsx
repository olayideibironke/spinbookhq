"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import SaveProfileButton from "./save-profile-button";

type DjProfileRow = {
  user_id: string;
  stage_name: string | null;
  slug: string | null;
  city: string | null;
  bio: string | null;
  published: boolean | null;
  avatar_url: string | null;
  starting_price: number | null;
  gallery_urls: string[] | null;
  social_handle: string | null;
};

type ProfileFormProps = {
  initialProfile: DjProfileRow | null;
  existingGalleryUrls: string[];
};

const MAX_FILE_SIZE_MB = 8;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <label className="text-sm font-semibold text-white/85">{label}</label>
        {hint ? <span className="text-xs text-white/45">{hint}</span> : null}
      </div>
      {children}
    </div>
  );
}

function isNonEmptyString(v: unknown) {
  return typeof v === "string" && v.trim().length > 0;
}

export default function ProfileForm({
  initialProfile,
  existingGalleryUrls,
}: ProfileFormProps) {
  const router = useRouter();

  const supabase = useMemo(() => {
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }, []);

  const [stageName, setStageName] = useState(initialProfile?.stage_name ?? "");
  const [socialHandle, setSocialHandle] = useState(
    initialProfile?.social_handle ?? ""
  );
  const [city, setCity] = useState(initialProfile?.city ?? "");
  const [startingPrice, setStartingPrice] = useState(
    initialProfile?.starting_price != null
      ? String(initialProfile.starting_price)
      : ""
  );
  const [bio, setBio] = useState(initialProfile?.bio ?? "");
  const [published, setPublished] = useState(Boolean(initialProfile?.published));
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const previewUrls = useMemo(() => {
    return selectedFiles.map((file) => URL.createObjectURL(file));
  }, [selectedFiles]);

  const showingUrls =
    selectedFiles.length > 0 ? previewUrls : existingGalleryUrls;

  const effectivePhotoCount =
    selectedFiles.length > 0 ? selectedFiles.length : existingGalleryUrls.length;

  const inputClass =
    "w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white " +
    "placeholder:text-white/45 shadow-sm outline-none transition " +
    "focus:border-white/20 focus:bg-white/[0.08] focus:ring-2 focus:ring-white/15";

  const textareaClass =
    "w-full min-h-[120px] resize-y rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white " +
    "placeholder:text-white/45 shadow-sm outline-none transition " +
    "focus:border-white/20 focus:bg-white/[0.08] focus:ring-2 focus:ring-white/15";

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);

    if (files.length === 0) {
      setSelectedFiles([]);
      return;
    }

    for (const file of files) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setMessage(
          "Only JPG, PNG, and WebP images are allowed."
        );
        event.target.value = "";
        setSelectedFiles([]);
        return;
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        setMessage(
          `Each photo must be ${MAX_FILE_SIZE_MB}MB or smaller. Please resize or compress the larger image and try again.`
        );
        event.target.value = "";
        setSelectedFiles([]);
        return;
      }
    }

    setMessage(null);
    setSelectedFiles(files);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    setPending(true);
    setMessage(null);

    try {
      if (!stageName.trim() || !city.trim()) {
        setMessage("Stage name and city are required.");
        setPending(false);
        return;
      }

      if (!socialHandle.trim()) {
        setMessage("Instagram, Facebook, X, Snapchat, or website is required.");
        setPending(false);
        return;
      }

      if (effectivePhotoCount < 3) {
        setMessage("You must upload at least 3 photos to complete onboarding.");
        setPending(false);
        return;
      }

      let galleryUrls = [...existingGalleryUrls];

      if (selectedFiles.length > 0) {
        const uploadedUrls: string[] = [];
        const bucket = "avatars";

        for (let i = 0; i < selectedFiles.length; i += 1) {
          const file = selectedFiles[i];

          if (!ACCEPTED_TYPES.includes(file.type)) {
            setMessage("Only JPG, PNG, and WebP images are allowed.");
            setPending(false);
            return;
          }

          if (file.size > MAX_FILE_SIZE_BYTES) {
            setMessage(
              `Each photo must be ${MAX_FILE_SIZE_MB}MB or smaller. Please resize or compress the larger image and try again.`
            );
            setPending(false);
            return;
          }

          const ext =
            file.type === "image/png"
              ? "png"
              : file.type === "image/webp"
              ? "webp"
              : "jpg";

          const path = `gallery/${Date.now()}-${i + 1}-${crypto.randomUUID()}.${ext}`;

          const upload = await supabase.storage.from(bucket).upload(path, file, {
            upsert: false,
            contentType: file.type || "image/jpeg",
            cacheControl: "3600",
          });

          if (upload.error) {
            setMessage(`Photo upload failed: ${upload.error.message}`);
            setPending(false);
            return;
          }

          const publicUrlResult = supabase.storage.from(bucket).getPublicUrl(path);
          const publicUrl = publicUrlResult.data.publicUrl ?? null;

          if (!publicUrl) {
            setMessage(
              "A photo uploaded but its public URL could not be created."
            );
            setPending(false);
            return;
          }

          uploadedUrls.push(publicUrl);
        }

        galleryUrls = uploadedUrls;
      }

      const response = await fetch("/api/dj/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          stage_name: stageName,
          social_handle: socialHandle,
          city,
          starting_price: startingPrice,
          bio,
          published,
          gallery_urls: galleryUrls,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error || "Profile save failed.");
        setPending(false);
        return;
      }

      router.push(result.redirectTo || "/dashboard");
      router.refresh();
    } catch (error) {
      const text =
        error instanceof Error ? error.message : "Unexpected error";
      setMessage(text);
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {message ? (
        <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-50">
          {message}
        </div>
      ) : null}

      <Field
        label="Photos (minimum 3 required)"
        hint={`JPG / PNG / WebP • Max ${MAX_FILE_SIZE_MB}MB each • Portrait photos recommended`}
      >
        {showingUrls.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {showingUrls.map((url, index) => (
              <div
                key={`${url}-${index}`}
                className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06]"
              >
                <div className="aspect-[3/4] w-full">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`DJ photo ${index + 1}`}
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-4 text-sm text-white/55">
            No photos uploaded yet.
          </div>
        )}

        <input
          className={inputClass}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          multiple
          onChange={handleFileChange}
        />

        <p className="mt-2 text-xs text-white/45">
          Upload at least <span className="font-semibold text-white/75">3</span>{" "}
          photos. Each image must be{" "}
          <span className="font-semibold text-white/75">
            {MAX_FILE_SIZE_MB}MB or smaller
          </span>
          . Larger files will be rejected automatically.
        </p>

        <p className="text-xs text-white/45">
          You currently have{" "}
          <span className="font-semibold text-white/75">
            {effectivePhotoCount}
          </span>{" "}
          selected/saved photo{effectivePhotoCount === 1 ? "" : "s"}.
        </p>

        <p className="text-xs text-white/45">
          Selecting a new batch of photos will replace your current photo set, so
          upload your full preferred set together.
        </p>
      </Field>

      <Field
        label="Stage name"
        hint="Used to build your public profile URL automatically."
      >
        <input
          className={inputClass}
          value={stageName}
          onChange={(e) => setStageName(e.target.value)}
          placeholder="DJ Nova"
          required
        />
        <p className="mt-2 text-xs text-white/45">
          Your public profile link will be generated automatically from your
          stage name.
        </p>
      </Field>

      <Field
        label="Instagram / Facebook / X / Snapchat / Website (required)"
        hint="Use a clear format so the correct icon can be shown on the DJ profile."
      >
        <input
          className={inputClass}
          value={socialHandle}
          onChange={(e) => setSocialHandle(e.target.value)}
          placeholder="instagram:@djname or website:https://yourwebsite.com"
          required
        />
        <p className="mt-2 text-xs text-white/45">
          Accepted formats:{" "}
          <span className="font-semibold text-white/75">instagram:@djname</span>,{" "}
          <span className="font-semibold text-white/75">facebook:@djpage</span>,{" "}
          <span className="font-semibold text-white/75">x:@djname</span>,{" "}
          <span className="font-semibold text-white/75">snapchat:@djname</span>, or{" "}
          <span className="font-semibold text-white/75">
            website:https://yourwebsite.com
          </span>
          . A plain <span className="font-semibold text-white/75">@handle</span>{" "}
          is treated as Instagram.
        </p>
      </Field>

      <Field label="City" hint="Example: Washington, DC">
        <input
          className={inputClass}
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Washington, DC"
          required
        />
      </Field>

      <Field label="Starting price (USD)" hint='Shows as “From $450”'>
        <div className="relative">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-extrabold text-white/55">
            $
          </span>
          <input
            className={`${inputClass} pl-9`}
            inputMode="numeric"
            value={startingPrice}
            onChange={(e) => setStartingPrice(e.target.value)}
            placeholder="450"
          />
        </div>
        <p className="mt-2 text-xs text-white/45">
          Clients see this on your profile and in Browse DJs.
        </p>
      </Field>

      <Field label="Bio" hint="Short intro. 600 chars max.">
        <textarea
          className={textareaClass}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Tell clients what you play, your vibe, and what makes your sets unique..."
          maxLength={600}
        />
      </Field>

      <div className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-white/[0.03] p-5">
        <label className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-extrabold text-white">Publish profile</p>
            <p className="mt-1 text-sm text-white/65">
              When published, you’ll appear on the Browse DJs page.
            </p>

            {effectivePhotoCount < 3 ? (
              <p className="mt-2 text-xs font-semibold text-amber-200/90">
                Minimum 3 photos are required before your onboarding can be considered complete.
              </p>
            ) : null}

            {!isNonEmptyString(socialHandle) ? (
              <p className="mt-2 text-xs font-semibold text-amber-200/90">
                A valid social or website entry is required.
              </p>
            ) : null}

            {!String(startingPrice).trim() ? (
              <p className="mt-2 text-xs font-semibold text-amber-200/90">
                Starting price is required to publish.
              </p>
            ) : null}
          </div>

          <input
            type="checkbox"
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
            className="h-5 w-5 accent-fuchsia-500"
          />
        </label>
      </div>

      <SaveProfileButton pending={pending} />
    </form>
  );
}