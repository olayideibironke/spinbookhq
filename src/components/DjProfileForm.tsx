"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function DjProfileForm() {
  const router = useRouter();
  const supabase = createClient();

  const [stageName, setStageName] = useState("");
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);

    try {
      const { data: userRes, error: userErr } = await supabase.auth.getUser();
      if (userErr) throw userErr;

      const user = userRes.user;
      if (!user) throw new Error("Not signed in");

      const { error } = await supabase.from("dj_profiles").insert({
        user_id: user.id,
        stage_name: stageName.trim(),
        city: city.trim() || null,
      });

      if (error) throw error;

      router.refresh();
      router.push("/dashboard");
    } catch (err: any) {
      setMsg(err?.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Stage name</label>
        <input
          className="w-full rounded-md border px-3 py-2"
          value={stageName}
          onChange={(e) => setStageName(e.target.value)}
          placeholder="DJ iMean"
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">City</label>
        <input
          className="w-full rounded-md border px-3 py-2"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="DMV"
        />
      </div>

      {msg ? <p className="text-sm">{msg}</p> : null}

      <button
        className="w-full rounded-md border px-3 py-2 font-medium"
        disabled={loading}
        type="submit"
      >
        {loading ? "Saving..." : "Save profile"}
      </button>
    </form>
  );
}
