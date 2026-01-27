// FILE: app/contact/page.tsx
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function ContactPage() {
  const FORM_ACTION = "https://formspree.io/f/mlgbwagq";

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-14">
      <div className="mb-10">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-3xl font-semibold tracking-tight">
            Contact SpinBook HQ
          </h1>
          <Link href="/" className="text-sm opacity-80 hover:opacity-100">
            ← Back to home
          </Link>
        </div>

        <p className="mt-3 text-sm opacity-70">
          For bookings, questions, or support, send us a message here. We
          typically respond within 24 hours.
        </p>

        <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm">
            Email: <span className="font-medium">info@spinbookhq.com</span>
          </p>
          <p className="mt-1 text-sm">
            Phone: <span className="font-medium">+1 (202) 765-9663</span>
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <form action={FORM_ACTION} method="POST" className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Full name
              </label>
              <input
                id="name"
                name="name"
                required
                placeholder="Your name"
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none focus:border-white/25"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="you@email.com"
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none focus:border-white/25"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="subject" className="text-sm font-medium">
              Subject
            </label>
            <input
              id="subject"
              name="subject"
              required
              placeholder="What’s this about?"
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none focus:border-white/25"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="message" className="text-sm font-medium">
              Message
            </label>
            <textarea
              id="message"
              name="message"
              required
              placeholder="Type your message…"
              rows={6}
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none focus:border-white/25"
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs opacity-60">
              By submitting, you agree SpinBook HQ may contact you regarding your
              request.
            </p>

            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black hover:opacity-90"
            >
              Send message
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
