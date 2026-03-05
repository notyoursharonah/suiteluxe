"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

function getSupabase(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
  return createClient(url, key);
}

let supabaseSingleton: SupabaseClient | null = null;
function supabase(): SupabaseClient {
  if (!supabaseSingleton) supabaseSingleton = getSupabase();
  return supabaseSingleton;
}

export default function Home() {
  const router = useRouter();
  const [roomNumber, setRoomNumber] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const db = useMemo(() => (typeof window !== "undefined" ? supabase() : null), []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const room = roomNumber.trim();
    const name = lastName.trim();

    console.log("[SuiteLuxe] Login attempt:", { room, name });

    if (!db) {
      console.error("[SuiteLuxe] Supabase client not available (not in browser?)");
      setError("Room not found. Please check your details.");
      setLoading(false);
      return;
    }

    try {
      const query = db
        .from("guest_sessions")
        .select("*")
        .eq("room_number", room)
        .eq("is_active", true)
        .ilike("guest_name", name);

      console.log("[SuiteLuxe] Query params: room_number =", JSON.stringify(room), ", is_active = true, guest_name ilike", JSON.stringify(name));

      const { data, error: queryError } = await query;

      console.log("[SuiteLuxe] Query result - data:", data);
      console.log("[SuiteLuxe] Query result - error:", queryError);
      if (queryError) {
        console.error("[SuiteLuxe] Supabase error details:", queryError.message, queryError.details, queryError.hint);
      }

      if (queryError) {
        setError("Room not found. Please check your details.");
        setLoading(false);
        return;
      }

      if (!data || data.length === 0) {
        setError("Room not found. Please check your details.");
        setLoading(false);
        return;
      }

      const session = data[0];
      localStorage.setItem(
        "suiteluxe_guest_session",
        JSON.stringify({
          id: session.id,
          room_number: session.room_number,
          guest_name: session.guest_name,
          hotel_id: (session as any).hotel_id ?? null,
        })
      );
      router.push("/dashboard");
    } catch (err) {
      console.error("[SuiteLuxe] Exception in handleSubmit:", err);
      setError("Room not found. Please check your details.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-4"
      style={{ backgroundColor: "#0D1B2A" }}
    >
      <div className="w-full max-w-sm text-center">
        {/* Logo */}
        <h1
          className="text-5xl font-normal tracking-wide sm:text-6xl"
          style={{ fontFamily: "Georgia, serif" }}
        >
          <span className="text-white">SUITE</span>
          <span style={{ color: "#C9993F" }}>LUXE</span>
        </h1>

        <p
          className="mt-3 text-sm tracking-widest uppercase"
          style={{ color: "#C9993F" }}
        >
          Your stay, elevated.
        </p>

        <form onSubmit={handleSubmit} className="mt-12 flex flex-col gap-5">
          <div>
            <label
              htmlFor="room"
              className="mb-1.5 block text-left text-xs font-medium uppercase tracking-wider text-white/80"
            >
              Room Number
            </label>
            <input
              id="room"
              type="text"
              value={roomNumber}
              onChange={(e) => setRoomNumber(e.target.value)}
              required
              className="w-full rounded border border-white/20 bg-white/5 px-4 py-3 text-white placeholder-white/40 outline-none transition focus:border-[#C9993F] focus:ring-1 focus:ring-[#C9993F]"
              placeholder="e.g. 401"
              disabled={loading}
            />
          </div>

          <div>
            <label
              htmlFor="lastName"
              className="mb-1.5 block text-left text-xs font-medium uppercase tracking-wider text-white/80"
            >
              Last Name
            </label>
            <input
              id="lastName"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              className="w-full rounded border border-white/20 bg-white/5 px-4 py-3 text-white placeholder-white/40 outline-none transition focus:border-[#C9993F] focus:ring-1 focus:ring-[#C9993F]"
              placeholder="As on reservation"
              disabled={loading}
            />
          </div>

          {error && (
            <p className="text-left text-sm text-amber-300/90">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded py-3.5 font-medium uppercase tracking-widest text-[#0D1B2A] transition hover:opacity-95 disabled:opacity-70"
            style={{ backgroundColor: "#C9993F" }}
          >
            {loading ? "Checking…" : "Access My Stay"}
          </button>
        </form>
      </div>
    </div>
  );
}
