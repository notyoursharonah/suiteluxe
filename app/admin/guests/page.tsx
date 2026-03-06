"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type GuestSession = {
  id: string;
  room_number: string | null;
  guest_name: string | null;
  check_in: string | null;
  check_out: string | null;
  is_active: boolean;
  pin: string | null;
  [key: string]: unknown;
};

function todayISO() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function tomorrowISO() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

export default function AdminGuestsPage() {
  const router = useRouter();
  const [roomNumber, setRoomNumber] = useState("");
  const [guestName, setGuestName] = useState("");
  const [pin, setPin] = useState("");
  const [checkInDate, setCheckInDate] = useState(todayISO());
  const [checkOutDate, setCheckOutDate] = useState(tomorrowISO());
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [guests, setGuests] = useState<GuestSession[]>([]);
  const [loadingGuests, setLoadingGuests] = useState(true);
  const [checkingOutId, setCheckingOutId] = useState<string | null>(null);

  const loadActiveGuests = async () => {
    setLoadingGuests(true);
    try {
      const { data, error } = await supabase
        .from("guest_sessions")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setGuests((data as GuestSession[]) ?? []);
    } catch (e) {
      console.error("[SuiteLuxe] Failed to load guests:", e);
      setGuests([]);
    } finally {
      setLoadingGuests(false);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const authed = localStorage.getItem("admin_authenticated");
      if (authed !== "true") {
        router.replace("/admin/login");
        return;
      }
    }
    loadActiveGuests();
  }, [router]);

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccess(null);
    setFormError(null);

    const roomNum = roomNumber.trim();
    const name = guestName.trim();
    const pinValue = pin.trim();

    if (pinValue.length < 4) {
      setFormError("PIN must be at least 4 digits.");
      setSubmitting(false);
      return;
    }

    try {
      const { data: hotelData } = await supabase
        .from("hotels")
        .select("id")
        .limit(1)
        .single();

      if (!hotelData?.id) throw new Error("No hotel found");

      const { data: roomData } = await supabase
        .from("rooms")
        .upsert(
          { hotel_id: hotelData.id, room_number: roomNum, room_type: "Standard" },
          { onConflict: "hotel_id,room_number" }
        )
        .select()
        .single();

      if (!roomData?.id) throw new Error("Room upsert failed");

      const { error: sessionError } = await supabase
        .from("guest_sessions")
        .insert({
          hotel_id: hotelData.id,
          room_id: roomData.id,
          room_number: roomNum,
          guest_name: name,
          pin: pinValue,
          check_in: checkInDate,
          check_out: checkOutDate,
          is_active: true,
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      setSuccess(`Guest checked in! Room ${roomNum} - ${name} · PIN: ${pinValue}`);
      setRoomNumber("");
      setGuestName("");
      setPin("");
      setCheckInDate(todayISO());
      setCheckOutDate(tomorrowISO());
      loadActiveGuests();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Check-in failed. Please try again.";
      setFormError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckOut = async (id: string) => {
    setCheckingOutId(id);
    try {
      const { error } = await supabase
        .from("guest_sessions")
        .update({ is_active: false })
        .eq("id", id);

      if (error) throw error;
      await loadActiveGuests();
    } catch (e) {
      console.error("[SuiteLuxe] Check out failed:", e);
    } finally {
      setCheckingOutId(null);
    }
  };

  return (
    <div
      className="min-h-screen px-4 py-6 sm:px-8 sm:py-8"
      style={{ backgroundColor: "#0D1B2A" }}
    >
      <header className="mx-auto flex w-full max-w-3xl items-center gap-4">
        <button
          type="button"
          onClick={() => router.push("/admin")}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/30 text-lg text-white/80 outline-none transition hover:border-[#C9993F] hover:text-white focus-visible:ring-2 focus-visible:ring-[#C9993F]"
          aria-label="Back to admin"
        >
          ←
        </button>
        <div>
          <h1
            className="text-2xl font-normal text-white sm:text-3xl"
            style={{ fontFamily: "Georgia, serif" }}
          >
            Guest Management
          </h1>
          <p
            className="mt-1 text-xs font-medium uppercase tracking-[0.25em]"
            style={{ color: "#C9993F" }}
          >
            Check in & manage guests
          </p>
        </div>
      </header>

      <main className="mx-auto mt-8 w-full max-w-3xl space-y-10">
        <section
          className="rounded-2xl p-6"
          style={{ backgroundColor: "#162233" }}
        >
          <h2 className="text-lg font-semibold text-white">Check In Guest</h2>
          <form onSubmit={handleCheckIn} className="mt-4 space-y-4">
            <div>
              <label htmlFor="room" className="mb-1 block text-xs font-medium uppercase tracking-wider text-white/70">
                Room Number
              </label>
              <input
                id="room"
                type="text"
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                required
                className="w-full rounded border border-white/20 bg-white/5 px-3 py-2 text-white placeholder-white/40 outline-none focus:border-[#C9993F] focus:ring-1 focus:ring-[#C9993F]"
                placeholder="e.g. 101"
              />
            </div>
            <div>
              <label htmlFor="name" className="mb-1 block text-xs font-medium uppercase tracking-wider text-white/70">
                Guest Last Name
              </label>
              <input
                id="name"
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                required
                className="w-full rounded border border-white/20 bg-white/5 px-3 py-2 text-white placeholder-white/40 outline-none focus:border-[#C9993F] focus:ring-1 focus:ring-[#C9993F]"
                placeholder="Last name"
              />
            </div>
            <div>
              <label htmlFor="pin" className="mb-1 block text-xs font-medium uppercase tracking-wider text-white/70">
                Guest PIN
              </label>
              <input
                id="pin"
                type="text"
                inputMode="numeric"
                maxLength={8}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                required
                className="w-full rounded border border-white/20 bg-white/5 px-3 py-2 text-white placeholder-white/40 outline-none focus:border-[#C9993F] focus:ring-1 focus:ring-[#C9993F]"
                placeholder="4-digit PIN e.g. 1234"
              />
              <p className="mt-1 text-xs text-white/40">Share this PIN with the guest at check-in.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="checkin" className="mb-1 block text-xs font-medium uppercase tracking-wider text-white/70">
                  Check In
                </label>
                <input
                  id="checkin"
                  type="date"
                  value={checkInDate}
                  onChange={(e) => setCheckInDate(e.target.value)}
                  required
                  className="w-full rounded border border-white/20 bg-white/5 px-3 py-2 text-white outline-none focus:border-[#C9993F] focus:ring-1 focus:ring-[#C9993F]"
                />
              </div>
              <div>
                <label htmlFor="checkout" className="mb-1 block text-xs font-medium uppercase tracking-wider text-white/70">
                  Check Out
                </label>
                <input
                  id="checkout"
                  type="date"
                  value={checkOutDate}
                  onChange={(e) => setCheckOutDate(e.target.value)}
                  required
                  className="w-full rounded border border-white/20 bg-white/5 px-3 py-2 text-white outline-none focus:border-[#C9993F] focus:ring-1 focus:ring-[#C9993F]"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-full px-4 py-2.5 text-center text-sm font-semibold uppercase tracking-wider text-[#0D1B2A] outline-none transition hover:opacity-95 disabled:opacity-60"
              style={{ backgroundColor: "#C9993F" }}
            >
              {submitting ? "Checking in…" : "Check In Guest"}
            </button>
            {success && <p className="text-sm text-emerald-300">{success}</p>}
            {formError && <p className="text-sm text-red-400">{formError}</p>}
          </form>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">Active Guests</h2>
          {loadingGuests ? (
            <p className="mt-3 text-sm text-white/60">Loading…</p>
          ) : guests.length === 0 ? (
            <p className="mt-3 text-sm text-white/60">No active guests.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {guests.map((g) => (
                <li
                  key={g.id}
                  className="flex flex-col rounded-2xl p-4 sm:flex-row sm:items-center sm:justify-between"
                  style={{ backgroundColor: "#162233" }}
                >
                  <div className="text-white">
                    <p className="font-semibold">
                      Room {g.room_number ?? "—"} · {g.guest_name ?? "—"}
                    </p>
                    <p className="mt-1 text-sm text-white/70">
                      Check in: {g.check_in ?? "—"} · Check out: {g.check_out ?? "—"}
                    </p>
                    {g.pin && (
                      <p className="mt-1 text-xs text-white/40">PIN: {g.pin}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCheckOut(g.id)}
                    disabled={checkingOutId === g.id}
                    className="mt-3 shrink-0 rounded-full bg-red-500/20 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-red-300 outline-none transition hover:bg-red-500/30 disabled:opacity-60 sm:mt-0"
                  >
                    {checkingOutId === g.id ? "Checking out…" : "Check Out"}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}