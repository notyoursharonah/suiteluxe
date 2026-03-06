"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type ServiceRequest = {
  id: string;
  created_at: string;
  room_number: string | null;
  guest_name: string | null;
  request_type: string;
  status: "pending" | "in progress" | "completed";
  assigned_to: string | null;
  notes: string | null;
};

type StaffSession = {
  id: string;
  name: string;
  role: string;
};

type RequestCardProps = {
  req: ServiceRequest;
  notes: Record<string, string>;
  setNotes: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  updatingId: string | null;
  handleUpdateStatus: (id: string) => void;
  handleSaveNote: (id: string) => void;
};

function RequestCard({ req, notes, setNotes, updatingId, handleUpdateStatus, handleSaveNote }: RequestCardProps) {
  const timeString = new Date(req.created_at).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className="flex flex-col rounded-2xl bg-[#162233] p-5 text-white shadow-lg">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-white/70">Room {req.room_number ?? "—"}</p>
          <p className="text-base font-semibold">{req.guest_name ?? "Unknown guest"}</p>
          <p className="mt-1 text-sm text-white/70">{req.request_type}</p>
        </div>
        <div className="text-right text-xs text-white/60">{timeString}</div>
      </div>

      <div className="mt-3">
        <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-white/50">
          Notes
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={notes[req.id] ?? req.notes ?? ""}
            onChange={(e) => setNotes((prev) => ({ ...prev, [req.id]: e.target.value }))}
            placeholder="Add a note…"
            className="flex-1 rounded border border-white/20 bg-[#0D1B2A] px-3 py-1.5 text-sm text-white placeholder-white/30 outline-none focus:border-[#C9993F]"
          />
          <button
            type="button"
            onClick={() => handleSaveNote(req.id)}
            className="rounded border border-white/20 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-white/70 transition hover:border-[#C9993F] hover:text-[#C9993F]"
          >
            Save
          </button>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
        <div>
          {req.status === "pending" && (
            <span className="rounded-full bg-yellow-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-yellow-300">
              Pending
            </span>
          )}
          {req.status === "in progress" && (
            <span className="rounded-full bg-orange-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-orange-300">
              In Progress
            </span>
          )}
          {req.status === "completed" && (
            <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
              Completed
            </span>
          )}
        </div>
        {req.status !== "completed" && (
          <button
            type="button"
            onClick={() => handleUpdateStatus(req.id)}
            disabled={updatingId === req.id}
            className="rounded-full bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-white outline-none transition hover:bg-white/10 disabled:opacity-60"
          >
            {updatingId === req.id ? "Updating…" : "Advance Status"}
          </button>
        )}
      </div>
    </div>
  );
}

export default function StaffPortalPage() {
  const router = useRouter();
  const [staff, setStaff] = useState<StaffSession | null>(null);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem("suiteluxe_staff_session");
    if (!raw) {
      router.replace("/staff/login");
      return;
    }
    const session = JSON.parse(raw) as StaffSession;
    setStaff(session);

    const loadRequests = async (staffId: string) => {
      setLoading(true);
      const { data, error } = await supabase
        .from("service_requests")
        .select("*")
        .eq("assigned_to", staffId)
        .order("created_at", { ascending: false });
      if (!error && data) setRequests(data as ServiceRequest[]);
      setLoading(false);
    };

    loadRequests(session.id);
  }, [router]);

  const cycleStatus = (current: ServiceRequest["status"]) => {
    if (current === "pending") return "in progress";
    if (current === "in progress") return "completed";
    return "completed";
  };

  const handleUpdateStatus = async (id: string) => {
    const req = requests.find((r) => r.id === id);
    if (!req) return;
    const nextStatus = cycleStatus(req.status);
    setUpdatingId(id);
    const { error } = await supabase
      .from("service_requests")
      .update({ status: nextStatus })
      .eq("id", id);
    if (!error) {
      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: nextStatus } : r))
      );
    }
    setUpdatingId(null);
  };

  const handleSaveNote = async (id: string) => {
    const note = notes[id] ?? "";
    const { error } = await supabase
      .from("service_requests")
      .update({ notes: note })
      .eq("id", id);
    if (!error) {
      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, notes: note } : r))
      );
    }
  };

  const pending = requests.filter((r) => r.status === "pending");
  const inProgress = requests.filter((r) => r.status === "in progress");
  const completed = requests.filter((r) => r.status === "completed");

  return (
    <div
      className="min-h-screen px-4 py-6 sm:px-8 sm:py-8"
      style={{ backgroundColor: "#0D1B2A" }}
    >
      <header className="mx-auto flex w-full max-w-4xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1
            className="text-2xl font-normal text-white sm:text-3xl"
            style={{ fontFamily: "Georgia, serif" }}
          >
            {staff?.name ?? "Staff Portal"}
          </h1>
          <p
            className="mt-1 text-xs font-medium uppercase tracking-[0.25em]"
            style={{ color: "#C9993F" }}
          >
            {staff?.role ?? ""} · My Assigned Requests
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            localStorage.removeItem("suiteluxe_staff_session");
            router.replace("/staff/login");
          }}
          className="rounded-full border border-white/25 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-white outline-none transition hover:border-[#C9993F] hover:text-[#C9993F]"
        >
          Sign Out
        </button>
      </header>

      <main className="mx-auto mt-8 w-full max-w-4xl space-y-10">
        {loading && <p className="text-sm text-white/60">Loading your requests…</p>}

        {!loading && requests.length === 0 && (
          <div className="rounded-2xl bg-[#162233] p-6 text-center">
            <p className="text-white/60 text-sm">No requests assigned to you yet.</p>
            <p className="mt-1 text-xs text-white/40">Check back soon or ask your admin.</p>
          </div>
        )}

        {pending.length > 0 && (
          <section>
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.25em] text-yellow-300">
              Pending ({pending.length})
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {pending.map((req) => (
                <RequestCard
                  key={req.id}
                  req={req}
                  notes={notes}
                  setNotes={setNotes}
                  updatingId={updatingId}
                  handleUpdateStatus={handleUpdateStatus}
                  handleSaveNote={handleSaveNote}
                />
              ))}
            </div>
          </section>
        )}

        {inProgress.length > 0 && (
          <section>
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.25em] text-orange-300">
              In Progress ({inProgress.length})
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {inProgress.map((req) => (
                <RequestCard
                  key={req.id}
                  req={req}
                  notes={notes}
                  setNotes={setNotes}
                  updatingId={updatingId}
                  handleUpdateStatus={handleUpdateStatus}
                  handleSaveNote={handleSaveNote}
                />
              ))}
            </div>
          </section>
        )}

        {completed.length > 0 && (
          <section>
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.25em] text-emerald-300">
              Completed ({completed.length})
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {completed.map((req) => (
                <RequestCard
                  key={req.id}
                  req={req}
                  notes={notes}
                  setNotes={setNotes}
                  updatingId={updatingId}
                  handleUpdateStatus={handleUpdateStatus}
                  handleSaveNote={handleSaveNote}
                />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}