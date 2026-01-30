// FILE: app/r/[token]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type PublicRequestRow = {
  id: string;
  status: string | null;
  event_date: string | null;
  event_location: string | null;
  requester_name: string | null;
  requester_email: string | null;
  deposit_paid: boolean | null;
  created_at: string | null;
};

export default async function PublicRequestPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const cleaned = String(token ?? "").trim();
  if (!cleaned) notFound();

  const supabase = await createClient();

  // ✅ Use SECURITY DEFINER RPC so anon users can view ONLY the row for this token
  const { data: rpcData, error: rpcErr } = await supabase.rpc(
    "get_booking_request_by_token",
    { p_token: cleaned }
  );

  const request = (Array.isArray(rpcData) ? rpcData[0] : rpcData) as
    | PublicRequestRow
    | null;

  if (rpcErr || !request?.id) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 shadow-[0_18px_60px_rgba(0,0,0,0.55)]">
        <h1 className="text-3xl font-extrabold text-white">
          Booking Request Status
        </h1>

        <p className="mt-2 text-sm text-white/65">
          This page lets you track your request.
        </p>

        <div className="mt-6 space-y-3 text-sm text-white/80">
          <div>
            <strong>Status:</strong>{" "}
            <span className="capitalize">{request.status ?? "new"}</span>
          </div>

          <div>
            <strong>Event date:</strong> {request.event_date ?? "—"}
          </div>

          <div>
            <strong>Location:</strong> {request.event_location ?? "—"}
          </div>

          <div>
            <strong>Deposit paid:</strong>{" "}
            {request.deposit_paid ? "Yes ✅" : "No"}
          </div>
        </div>

        <div className="mt-8 flex gap-3">
          <Link
            href="/"
            className="inline-flex items-center rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-semibold text-white/80 hover:bg-white/[0.06]"
          >
            ← Back to home
          </Link>

          <Link
            href="/djs"
            className="inline-flex items-center rounded-xl bg-violet-600 px-4 py-2 text-sm font-extrabold text-white hover:brightness-110"
          >
            Find DJs
          </Link>
        </div>
      </div>
    </main>
  );
}
