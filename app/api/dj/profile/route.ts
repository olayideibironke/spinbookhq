import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type SocialPlatform = "instagram" | "facebook" | "x" | "snapchat" | "website";

type ParsedSocial = {
  platform: SocialPlatform;
  label: string;
  href: string;
  storage: string;
};

const MIN_STARTING_PRICE = 450;
const MIN_BIO_WORDS = 60;

function isNonEmptyString(v: unknown) {
  return typeof v === "string" && v.trim().length > 0;
}

function countWords(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function toPositiveIntOrNull(v: string | number | null | undefined) {
  const trimmed = String(v ?? "").trim();
  if (!trimmed) return null;

  const digits = trimmed.replace(/[^\d]/g, "");
  if (!digits) return null;

  const n = Number(digits);
  if (!Number.isFinite(n)) return null;

  const int = Math.floor(n);
  if (int <= 0) return null;

  return int;
}

function normalizeSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function cleanHandle(value: string) {
  const stripped = value.trim().replace(/\s+/g, "").replace(/^@+/, "");
  if (!stripped) return "";
  return `@${stripped}`;
}

function extractPrimaryPathnamePart(url: URL) {
  const segments = url.pathname.split("/").filter(Boolean);
  return segments[0] ?? "";
}

function buildSocialHref(platform: SocialPlatform, labelOrUrl: string) {
  if (platform === "website") {
    return labelOrUrl;
  }

  const handle = labelOrUrl.replace(/^@/, "");

  if (platform === "instagram") {
    return `https://www.instagram.com/${handle}`;
  }

  if (platform === "facebook") {
    return `https://www.facebook.com/${handle}`;
  }

  if (platform === "x") {
    return `https://x.com/${handle}`;
  }

  return `https://www.snapchat.com/add/${handle}`;
}

function parseSocialInput(value: string): ParsedSocial | null {
  const raw = value.trim();
  if (!raw) return null;

  const lowerRaw = raw.toLowerCase();

  const prefixedMatch = raw.match(/^([a-zA-Z]+)\s*:\s*(.+)$/);
  if (prefixedMatch) {
    const prefix = prefixedMatch[1].toLowerCase();
    const payload = prefixedMatch[2].trim();

    let platform: SocialPlatform | null = null;

    if (prefix === "instagram" || prefix === "ig") platform = "instagram";
    if (prefix === "facebook" || prefix === "fb") platform = "facebook";
    if (prefix === "x" || prefix === "twitter") platform = "x";
    if (prefix === "snapchat" || prefix === "snap") platform = "snapchat";
    if (
      prefix === "website" ||
      prefix === "site" ||
      prefix === "web" ||
      prefix === "url"
    ) {
      platform = "website";
    }

    if (!platform) return null;

    if (platform === "website") {
      try {
        const url = new URL(
          /^https?:\/\//i.test(payload) ? payload : `https://${payload}`
        );
        const href = url.toString();
        const label = url.hostname.replace(/^www\./i, "");
        return {
          platform,
          label,
          href,
          storage: `website:${href}`,
        };
      } catch {
        return null;
      }
    }

    if (/^https?:\/\//i.test(payload)) {
      try {
        const url = new URL(payload);
        const part = extractPrimaryPathnamePart(url);
        const label = cleanHandle(part || payload);
        if (!label) return null;

        return {
          platform,
          label,
          href: buildSocialHref(platform, label),
          storage: `${platform}:${label}`,
        };
      } catch {
        return null;
      }
    }

    const label = cleanHandle(payload);
    if (!label) return null;

    return {
      platform,
      label,
      href: buildSocialHref(platform, label),
      storage: `${platform}:${label}`,
    };
  }

  if (/^https?:\/\//i.test(raw) || /^[a-z0-9-]+\.[a-z]{2,}/i.test(raw)) {
    try {
      const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
      const host = url.hostname.toLowerCase().replace(/^www\./, "");

      if (host.includes("instagram.com")) {
        const label = cleanHandle(extractPrimaryPathnamePart(url));
        if (!label) return null;

        return {
          platform: "instagram",
          label,
          href: buildSocialHref("instagram", label),
          storage: `instagram:${label}`,
        };
      }

      if (host === "fb.com" || host.includes("facebook.com")) {
        const label = cleanHandle(extractPrimaryPathnamePart(url));
        if (!label) return null;

        return {
          platform: "facebook",
          label,
          href: buildSocialHref("facebook", label),
          storage: `facebook:${label}`,
        };
      }

      if (host === "x.com" || host.includes("twitter.com")) {
        const label = cleanHandle(extractPrimaryPathnamePart(url));
        if (!label) return null;

        return {
          platform: "x",
          label,
          href: buildSocialHref("x", label),
          storage: `x:${label}`,
        };
      }

      if (host.includes("snapchat.com")) {
        const segments = url.pathname.split("/").filter(Boolean);
        const snapTarget =
          segments[0] === "add" && segments[1] ? segments[1] : segments[0] ?? "";
        const label = cleanHandle(snapTarget);
        if (!label) return null;

        return {
          platform: "snapchat",
          label,
          href: buildSocialHref("snapchat", label),
          storage: `snapchat:${label}`,
        };
      }

      const href = url.toString();
      return {
        platform: "website",
        label: url.hostname.replace(/^www\./i, ""),
        href,
        storage: `website:${href}`,
      };
    } catch {
      return null;
    }
  }

  if (lowerRaw.startsWith("@") || /^[a-z0-9._]+$/i.test(raw)) {
    const label = cleanHandle(raw);
    if (!label) return null;

    return {
      platform: "instagram",
      label,
      href: buildSocialHref("instagram", label),
      storage: `instagram:${label}`,
    };
  }

  return null;
}

async function buildUniqueSlug(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  stageName: string,
  currentSlug?: string | null
) {
  const baseSlug = normalizeSlug(stageName);

  if (!baseSlug) return null;

  const { data, error } = await supabase
    .from("dj_profiles")
    .select("user_id, slug")
    .ilike("slug", `${baseSlug}%`);

  if (error) return null;

  const rows = Array.isArray(data) ? data : [];
  const taken = new Set(
    rows
      .filter((row) => row.user_id !== userId && isNonEmptyString(row.slug))
      .map((row) => String(row.slug))
  );

  if (
    currentSlug &&
    normalizeSlug(currentSlug) === baseSlug &&
    !taken.has(baseSlug)
  ) {
    return baseSlug;
  }

  if (!taken.has(baseSlug)) {
    return baseSlug;
  }

  let i = 2;
  while (taken.has(`${baseSlug}-${i}`)) {
    i += 1;
  }

  return `${baseSlug}-${i}`;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "You must be signed in to save your profile." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const stage_name = String(body.stage_name ?? "").trim();
    const city = String(body.city ?? "").trim();
    const bio = String(body.bio ?? "").trim().slice(0, 2000);
    const bioWordCount = countWords(bio);
    const social_handle_input = String(body.social_handle ?? "").trim();
    const published = Boolean(body.published);
    const starting_price = toPositiveIntOrNull(body.starting_price);
    const gallery_urls = Array.isArray(body.gallery_urls)
      ? body.gallery_urls.filter((url: unknown): url is string => isNonEmptyString(url))
      : [];

    if (!stage_name || !city) {
      return NextResponse.json(
        { error: "Stage name and city are required." },
        { status: 400 }
      );
    }

    const parsedSocial = parseSocialInput(social_handle_input);
    if (!parsedSocial) {
      return NextResponse.json(
        {
          error:
            "Enter your social or website in one of these formats: instagram:@djname, facebook:@djpage, x:@djname, snapchat:@djname, or website:https://yourwebsite.com. A plain @handle is treated as Instagram.",
        },
        { status: 400 }
      );
    }

    if (gallery_urls.length < 3) {
      return NextResponse.json(
        {
          error: "You must upload at least 3 photos to complete onboarding.",
        },
        { status: 400 }
      );
    }

    if (!bio || bioWordCount < MIN_BIO_WORDS) {
      return NextResponse.json(
        {
          error: `Bio is required and must be at least ${MIN_BIO_WORDS} words. Please describe your style, experience, event types, and what clients can expect when booking you.`,
        },
        { status: 400 }
      );
    }

    if (!starting_price) {
      return NextResponse.json(
        {
          error: `Starting price is required. SpinBook HQ minimum starting price is $${MIN_STARTING_PRICE}.`,
        },
        { status: 400 }
      );
    }

    if (starting_price < MIN_STARTING_PRICE) {
      return NextResponse.json(
        {
          error: `Starting price cannot be lower than $${MIN_STARTING_PRICE}. Please update your rate to continue.`,
        },
        { status: 400 }
      );
    }

    if (!published) {
      return NextResponse.json(
        {
          error:
            "You must check Publish profile before saving. Profiles cannot remain in draft during DJ onboarding.",
        },
        { status: 400 }
      );
    }

    const { data: currentProfile } = await supabase
      .from("dj_profiles")
      .select("slug")
      .eq("user_id", user.id)
      .maybeSingle<{ slug: string | null }>();

    const uniqueSlug = await buildUniqueSlug(
      supabase,
      user.id,
      stage_name,
      currentProfile?.slug ?? null
    );

    if (!uniqueSlug) {
      return NextResponse.json(
        {
          error:
            "We could not generate a valid public profile link from your stage name. Please adjust your stage name and try again.",
        },
        { status: 400 }
      );
    }

    const avatar_url = gallery_urls[0] ?? null;

    const payload = {
      user_id: user.id,
      stage_name,
      slug: uniqueSlug,
      city,
      bio,
      published: true,
      avatar_url,
      starting_price,
      social_handle: parsedSocial.storage,
      gallery_urls,
    };

    const { error } = await supabase.from("dj_profiles").upsert(payload, {
      onConflict: "user_id",
    });

    if (error) {
      return NextResponse.json(
        { error: `Save failed: ${error.message}` },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      redirectTo: `/dashboard?msg=${encodeURIComponent(
        "Profile saved and published."
      )}`,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}