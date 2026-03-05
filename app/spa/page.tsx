"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Treatment = {
  id: string;
  name: string;
  duration: string;
  price: number;
};

const TREATMENTS: Treatment[] = [
  { id: "deep-tissue", name: "Deep Tissue Massage", duration: "60 min", price: 120 },
  { id: "hot-stone", name: "Hot Stone Massage", duration: "75 min", price: 150 },
  { id: "classic-facial", name: "Classic Facial", duration: "45 min", price: 90 },
  { id: "body-scrub", name: "Body Scrub", duration: "60 min", price: 110 },
  { id: "couples-massage", name: "Couples Massage", duration: "90 min", price: 240 },
  { id: "aromatherapy", name: "Aromatherapy", duration: "60 min", price: 100 },
];

const TIME_SLOTS = ["Morning 9am", "Afternoon 2pm", "Evening 6pm"] as const;
type TimeSlot = (typeof TIME_SLOTS)[number];

export default function SpaPage() {
  const router = useRouter();
  const [activeTreatmentId, setActiveTreatmentId] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [confirmation, setConfirmation] = useState<string | null>(null);

  const handleBookClick = (id: string) => {
    setConfirmation(null);
    if (activeTreatmentId === id) {
      // Toggle off if clicking same card
      setActiveTreatmentId(null);
      setSelectedSlot(null);
      return;
    }
    setActiveTreatmentId(id);
    setSelectedSlot(null);
  };

  const handleSelectSlot = (slot: TimeSlot, treatmentId: string) => {
    const treatment = TREATMENTS.find((t) => t.id === treatmentId);
    if (!treatment) return;
    setSelectedSlot(slot);
    setConfirmation(`Booked! Your ${treatment.name} is confirmed for ${slot}.`);
  };

  return (
    <div
      className="flex min-h-screen flex-col px-4 py-6 sm:px-8 sm:py-8"
      style={{ backgroundColor: "#0D1B2A" }}
    >
      {/* Header with back */}
      <header className="mx-auto flex w-full max-w-5xl items-center gap-4">
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 text-lg text-white/80 outline-none transition hover:border-[#C9993F] hover:text-white focus-visible:ring-2 focus-visible:ring-[#C9993F]"
          aria-label="Back to dashboard"
        >
          ←
        </button>
        <div className="flex flex-col">
          <h1
            className="text-2xl font-normal text-white sm:text-3xl"
            style={{ fontFamily: "Georgia, serif" }}
          >
            Book Spa
          </h1>
          <p
            className="text-xs font-medium uppercase tracking-[0.25em]"
            style={{ color: "#C9993F" }}
          >
            Treatments & wellness
          </p>
        </div>
      </header>

      {/* Treatments grid */}
      <main className="mx-auto mt-8 flex w-full max-w-5xl flex-1 flex-col">
        <div className="grid gap-5 sm:grid-cols-2">
          {TREATMENTS.map((treatment) => {
            const isActive = treatment.id === activeTreatmentId;

            return (
              <div
                key={treatment.id}
                className="flex flex-col rounded-2xl bg-[#162233] p-5 text-white shadow-lg"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="text-lg font-semibold sm:text-xl">
                    {treatment.name}
                  </h2>
                  <span
                    className="text-base font-semibold"
                    style={{ color: "#C9993F" }}
                  >
                    ${treatment.price}
                  </span>
                </div>
                <p className="mt-2 text-sm text-white/70">
                  {treatment.duration}
                </p>

                <button
                  type="button"
                  onClick={() => handleBookClick(treatment.id)}
                  className="mt-4 inline-flex items-center justify-center rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#0D1B2A] outline-none transition hover:opacity-95"
                  style={{ backgroundColor: "#C9993F" }}
                >
                  Book Now
                </button>

                {isActive && (
                  <div className="mt-4 rounded-xl bg-[#0D1B2A] p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">
                      Select a time
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {TIME_SLOTS.map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => handleSelectSlot(slot, treatment.id)}
                          className={`rounded-full px-3 py-1 text-xs font-medium text-white outline-none transition ${
                            selectedSlot === slot && isActive
                              ? "bg-[#C9993F] text-[#0D1B2A]"
                              : "bg-white/5 hover:bg-white/10"
                          }`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {confirmation && (
          <p className="mt-6 text-sm text-emerald-300">{confirmation}</p>
        )}
      </main>
    </div>
  );
}

