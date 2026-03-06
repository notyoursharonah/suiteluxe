"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const router = useRouter();
  const [roomNumber, setRoomNumber] = useState("");
  const [lastName, setLastName] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const db = useMemo(
    () => (typeof window !== "undefined" ? supabase : null),
    []
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const room = roomNumber.trim();
    const name = lastName.trim();
    const pinValue = pin.trim();

    if (!db) {
      setError("Room not found. Please check your details.");
      setLoading(false);
      return;
    }

    try {
      const { data, error: queryError } = await db
        .from("guest_sessions")
        .select("*")
        .eq("room_number", room)
        .eq("is_active", true)
        .ilike("guest_name", name);

      if (queryError || !data || data.length === 0) {
        setError("Room not found. Please check your details.");
        setLoading(false);
        return;
      }

      const session = data[0] as { id: string; room_number: string; guest_name: string; hotel_id?: string; pin?: string };

      if (!session.pin || session.pin !== pinValue) {
        setError("Incorrect PIN. Please try again.");
        setLoading(false);
        return;
      }

      localStorage.setItem(
        "suiteluxe_guest_session",
        JSON.stringify({
          id: session.id,
          room_number: session.room_number,
          guest_name: session.guest_name,
          hotel_id: session.hotel_id ?? null,
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

          <div>
            <label
              htmlFor="pin"
              className="mb-1.5 block text-left text-xs font-medium uppercase tracking-wider text-white/80"
            >
              PIN
            </label>
            <input
              id="pin"
              type="password"
              inputMode="numeric"
              maxLength={8}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              required
              className="w-full rounded border border-white/20 bg-white/5 px-4 py-3 text-white placeholder-white/40 outline-none transition focus:border-[#C9993F] focus:ring-1 focus:ring-[#C9993F]"
              placeholder="Provided at check-in"
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
