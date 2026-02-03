// FILE: app/dj-waitlist/page.tsx

import Link from "next/link";
import { redirect } from "next/navigation";
import { APP_NAME } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type ExperienceBand = "1-3" | "3-5" | "5+";

function clean(s: unknown) {
  return String(s ?? "").trim();
}

function cleanLower(s: unknown) {
  return clean(s).toLowerCase();
}

function safeParam(s: string) {
  return encodeURIComponent(s.slice(0, 120));
}

function escapeHtml(input: string) {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function sendWaitlistConfirmationEmail(args: {
  toEmail: string;
  stageName: string;
  city: string;
  experienceBand: ExperienceBand;
  instagram?: string | null;
  genres?: string | null;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  const cc = "spinbookhq@gmail.com";

  if (!apiKey || !from) {
    throw new Error("email_not_configured");
  }

  const subject = `✅ You’re in — ${APP_NAME} Founding DJ Waitlist`;

  const safeStage = args.stageName || "DJ";
  const safeCity = args.city || "—";
  const safeExp =
    args.experienceBand === "1-3"
      ? "1–3 years"
      : args.experienceBand === "3-5"
      ? "3–5 years"
      : "5+ years";

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.55;color:#111">
      <h2>Application received ✅</h2>
      <p>Hey ${escapeHtml(safeStage)},</p>
      <p>We’ve received your application for the <b>${escapeHtml(
        APP_NAME
      )} Founding DJ Waitlist</b>.</p>

      <div style="margin:16px 0;padding:12px;border:1px solid #e5e7eb;border-radius:12px;background:#fafafa">
        <b>Your application summary</b><br/>
        City: ${escapeHtml(safeCity)}<br/>
        Experience: ${escapeHtml(safeExp)}
      </div>

      <p>If approved, you’ll receive a private invite to complete your DJ profile.</p>
      <p style="font-size:13px;color:#555">— SpinBook HQ Team</p>
    </div>
  `;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: args.toEmail,
      cc: [cc],
      subject,
      html,
    }),
  });

  if (!res.ok) {
    throw new Error("email_send_failed");
  }
}

async function submitWaitlist(formData: FormData) {
  "use server";

  const stage_name = clean(formData.get("stage_name"));
  const email = cleanLower(formData.get("email"));
  const city = clean(formData.get("city"));
  const experience_band = clean(
    formData.get("experience_band")
  ) as ExperienceBand;

  if (!stage_name || !email || !city || !experience_band) {
    redirect("/dj-waitlist?error=missing");
  }

  const supabase = await createClient();

  const { error } = await supabase.from("dj_waitlist").insert({
    stage_name,
    email,
    city,
    experience_band,
    status: "pending",
  });

  if (error && !String(error.message).includes("duplicate")) {
    redirect(`/dj-waitlist?error=${safeParam("submit")}`);
  }

  try {
    await sendWaitlistConfirmationEmail({
      toEmail: email,
      stageName: stage_name,
      city,
      experienceBand: experience_band,
    });
    redirect("/dj-waitlist?submitted=1");
  } catch {
    redirect("/dj-waitlist?submitted=1&email=failed");
  }
}

export default async function DjWaitlistPage({
  searchParams,
}: {
  searchParams?: Promise<{ submitted?: string; error?: string; email?: string }>;
}) {
  const sp = (await searchParams) ?? {};
  const submitted = sp.submitted === "1";
  const emailFailed = sp.email === "failed";

  return (
    <main className="min-h-screen bg-black text-white">
      <section className="mx-auto max-w-3xl px-6 py-20">
        {submitted ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-lg font-semibold">Application received ✅</h2>
            <p className="mt-2 text-sm text-white/70">
              Thanks for applying to become a Founding DJ on {APP_NAME}.
            </p>

            {emailFailed && (
              <p className="mt-3 text-xs text-white/60">
                Your application was saved, but the confirmation email did not send.
              </p>
            )}

            <div className="mt-5 flex gap-3">
              <Link href="/" className="rounded-full border px-5 py-2">
                Back to home
              </Link>
              <Link
                href="/login?dj=1"
                className="rounded-full bg-white px-5 py-2 text-black"
              >
                DJ login
              </Link>
            </div>
          </div>
        ) : (
          <form action={submitWaitlist} className="space-y-4">
            <input name="stage_name" placeholder="DJ / Stage Name" required />
            <input name="email" type="email" placeholder="Email Address" required />
            <input name="city" placeholder="City / Location" required />

            {/* ✅ FIXED DROPDOWN */}
            <select name="experience_band" required defaultValue="">
              <option value="" disabled>
                Select…
              </option>
              <option value="1-3">1-3 years</option>
              <option value="3-5">3-5 years</option>
              <option value="5+">5+ years</option>
            </select>

            <button type="submit">Apply to join</button>
          </form>
        )}
      </section>
    </main>
  );
}
