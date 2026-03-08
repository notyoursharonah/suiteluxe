"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type MenuItem = {
  id: string;
  name: string;
  price: number;
  category: string;
  available: boolean;
};

export default function TVPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [time, setTime] = useState("");
  const [date, setDate] = useState("");

  useEffect(() => {
    const loadMenu = async () => {
      const { data } = await supabase
        .from("menu_items")
        .select("*")
        .eq("available", true)
        .order("category");
      if (data) setMenuItems(data as MenuItem[]);
    };
    loadMenu();

    const tick = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }));
      setDate(now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" }));
    };
    tick();
    const interval = setInterval(tick, 1000);
    const refresh = setTimeout(() => window.location.reload(), 5 * 60 * 1000);
    return () => { clearInterval(interval); clearTimeout(refresh); };
  }, []);

  const specials = menuItems.slice(0, 4);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&color=C9993F&bgcolor=1a1108&data=https://suiteluxe.vercel.app`;

  return (
    <div
      className="relative flex h-screen w-screen flex-col overflow-hidden select-none"
      style={{
        background: "radial-gradient(ellipse at 20% 50%, #2a1f0e 0%, #1a1108 40%, #0f0c08 100%)",
        fontFamily: "Georgia, serif",
      }}
    >
      {/* Ambient glow top left */}
      <div
        className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full opacity-20"
        style={{ background: "radial-gradient(circle, #C9993F 0%, transparent 70%)" }}
      />
      {/* Ambient glow bottom right */}
      <div
        className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full opacity-10"
        style={{ background: "radial-gradient(circle, #C9993F 0%, transparent 70%)" }}
      />

      {/* Outer gold frame */}
      <div className="pointer-events-none absolute inset-4 z-10" style={{ border: "1px solid rgba(201,153,63,0.5)" }} />
      {/* Inner gold frame */}
      <div className="pointer-events-none absolute inset-6 z-10" style={{ border: "1px solid rgba(201,153,63,0.2)" }} />

      {/* Corner ornaments */}
      {[
        "top-4 left-4",
        "top-4 right-4 rotate-90",
        "bottom-4 left-4 -rotate-90",
        "bottom-4 right-4 rotate-180",
      ].map((pos, i) => (
        <div key={i} className={`pointer-events-none absolute z-20 ${pos} h-6 w-6`}>
          <div className="absolute top-0 left-0 h-full w-px" style={{ backgroundColor: "#C9993F" }} />
          <div className="absolute top-0 left-0 h-px w-full" style={{ backgroundColor: "#C9993F" }} />
        </div>
      ))}

      {/* Header */}
      <header className="relative z-20 flex items-start justify-between px-20 pt-12">
        {/* Logo */}
        <div className="flex flex-col items-start">
          <div
            className="relative px-8 py-3"
            style={{
              border: "1px solid #C9993F",
              background: "linear-gradient(135deg, rgba(201,153,63,0.15) 0%, rgba(201,153,63,0.05) 100%)",
            }}
          >
            {/* Corner dots */}
            {["top-0 left-0", "top-0 right-0", "bottom-0 left-0", "bottom-0 right-0"].map((pos, i) => (
              <div key={i} className={`absolute ${pos} h-1.5 w-1.5 -translate-x-0.5 -translate-y-0.5`} style={{ backgroundColor: "#C9993F" }} />
            ))}
            <span className="text-4xl font-normal tracking-[0.25em] text-white">SUITE</span>
            <span className="text-4xl font-normal tracking-[0.25em]" style={{ color: "#C9993F" }}>LUXE</span>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <div className="h-px w-8" style={{ backgroundColor: "#C9993F", opacity: 0.5 }} />
            <p className="text-xs uppercase tracking-[0.4em]" style={{ color: "#C9993F" }}>
              Experience the Luxe Life
            </p>
            <div className="h-px w-8" style={{ backgroundColor: "#C9993F", opacity: 0.5 }} />
          </div>
        </div>

        {/* Clock */}
        <div className="text-right">
          <p
            className="text-7xl font-extralight text-white tabular-nums"
            style={{ letterSpacing: "-0.02em", textShadow: "0 0 40px rgba(201,153,63,0.3)" }}
          >
            {time}
          </p>
          <p className="mt-2 text-sm uppercase tracking-[0.3em]" style={{ color: "#C9993F", opacity: 0.7 }}>
            {date}
          </p>
        </div>
      </header>

      {/* Gold divider line */}
      <div className="relative z-20 mx-20 mt-6 flex items-center gap-4">
        <div className="h-px flex-1" style={{ background: "linear-gradient(to right, transparent, #C9993F, transparent)" }} />
        <div className="h-1 w-1 rotate-45" style={{ backgroundColor: "#C9993F" }} />
        <div className="h-px flex-1" style={{ background: "linear-gradient(to right, transparent, #C9993F, transparent)" }} />
      </div>

      {/* Main content */}
      <main className="relative z-20 flex flex-1 items-center gap-0 px-20 py-6">

        {/* Left — Welcome */}
        <div className="flex flex-1 flex-col justify-center pr-16">
          <p className="text-xs uppercase tracking-[0.5em]" style={{ color: "#C9993F" }}>
            ✦ &nbsp; Welcome to
          </p>
          <h1
            className="mt-4 font-extralight leading-none text-white"
            style={{ fontSize: "5.5rem", textShadow: "0 2px 40px rgba(0,0,0,0.8)" }}
          >
            The Grand<br />
            <span style={{ color: "#e8d5a3" }}>Demo Hotel</span>
          </h1>
          <p className="mt-6 text-lg font-light leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
            Your comfort is our highest priority.<br />
            Scan to access all guest services instantly.
          </p>

          {/* QR code */}
          <div className="mt-8 flex items-center gap-8">
            <div
              className="relative flex h-36 w-36 items-center justify-center"
              style={{
                border: "1px solid rgba(201,153,63,0.6)",
                background: "#1a1108",
                padding: "8px",
              }}
            >
              {/* QR corner marks */}
              {["top-1 left-1", "top-1 right-1", "bottom-1 left-1", "bottom-1 right-1"].map((pos, i) => (
                <div key={i} className={`absolute ${pos} h-3 w-3`}>
                  <div className="absolute top-0 left-0 h-full w-0.5" style={{ backgroundColor: "#C9993F" }} />
                  <div className="absolute top-0 left-0 h-0.5 w-full" style={{ backgroundColor: "#C9993F" }} />
                </div>
              ))}
              <img
                src={qrUrl}
                alt="QR Code"
                className="h-full w-full"
                style={{ imageRendering: "pixelated" }}
              />
            </div>
            <div>
              <p className="text-base font-medium text-white">Scan to access</p>
              <p className="mt-1 text-sm" style={{ color: "rgba(201,153,63,0.7)" }}>
                suiteluxe.vercel.app
              </p>
              <div className="mt-4 flex items-center gap-2">
                {["Room", "Name", "PIN"].map((label, i) => (
                  <span key={i}>
                    <span
                      className="rounded px-2 py-1 text-xs uppercase tracking-widest"
                      style={{ backgroundColor: "rgba(201,153,63,0.15)", color: "#C9993F", border: "1px solid rgba(201,153,63,0.3)" }}
                    >
                      {label}
                    </span>
                    {i < 2 && <span className="ml-2 text-white/20">·</span>}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Vertical divider */}
        <div
          className="h-72 w-px mx-4 flex-shrink-0"
          style={{ background: "linear-gradient(to bottom, transparent, #C9993F, transparent)", opacity: 0.4 }}
        />

        {/* Right — Menu highlights */}
        <div className="flex w-[420px] flex-col pl-16 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-px w-6" style={{ backgroundColor: "#C9993F", opacity: 0.6 }} />
            <p className="text-xs uppercase tracking-[0.5em]" style={{ color: "#C9993F" }}>
              Today's Highlights
            </p>
          </div>
          <h2 className="mt-2 text-3xl font-extralight text-white">From Our Kitchen</h2>

          <ul className="mt-6 space-y-0">
            {specials.length === 0 ? (
              <li className="text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>Loading menu…</li>
            ) : (
              specials.map((item, i) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between py-4"
                  style={{ borderBottom: "1px solid rgba(201,153,63,0.15)" }}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-xs" style={{ color: "rgba(201,153,63,0.4)" }}>0{i + 1}</span>
                    <div>
                      <p className="text-base font-medium text-white">{item.name}</p>
                      <p className="text-xs uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>
                        {item.category}
                      </p>
                    </div>
                  </div>
                  <p
                    className="text-lg font-light"
                    style={{ color: "#C9993F" }}
                  >
                    ${item.price}
                  </p>
                </li>
              ))
            )}
          </ul>

          <p className="mt-5 text-xs uppercase tracking-[0.3em]" style={{ color: "rgba(255,255,255,0.2)" }}>
            ✦ &nbsp; Order via the SuiteLuxe app
          </p>
        </div>
      </main>

      {/* Bottom divider */}
      <div className="relative z-20 mx-20 mb-4 flex items-center gap-4">
        <div className="h-px flex-1" style={{ background: "linear-gradient(to right, transparent, #C9993F, transparent)" }} />
        <div className="h-1 w-1 rotate-45" style={{ backgroundColor: "#C9993F" }} />
        <div className="h-px flex-1" style={{ background: "linear-gradient(to right, transparent, #C9993F, transparent)" }} />
      </div>

      {/* Footer */}
      <footer className="relative z-20 flex items-center justify-between px-20 pb-10">
        <p className="text-xs uppercase tracking-[0.3em]" style={{ color: "rgba(255,255,255,0.2)" }}>
          © SuiteLuxe · All rights reserved
        </p>
        <div className="flex items-center gap-6">
          {["Dining", "Spa", "Service", "Upgrades"].map((item, i) => (
            <span key={item} className="flex items-center gap-6">
              <span className="text-xs uppercase tracking-[0.3em]" style={{ color: "rgba(201,153,63,0.6)" }}>
                {item}
              </span>
              {i < 3 && <span style={{ color: "rgba(201,153,63,0.3)" }}>·</span>}
            </span>
          ))}
        </div>
      </footer>
    </div>
  );
}