"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
};

type GuestSession = {
  id: string;
  room_number: string;
  guest_name: string;
  hotel_id?: string;
};

export default function DiningPage() {
  const router = useRouter();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [session, setSession] = useState<GuestSession | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem("suiteluxe_guest_session");
    if (!raw) return;
    try {
      const data = JSON.parse(raw);
      setSession(data);
    } catch {
      // ignore malformed session
    }
  }, []);

  useEffect(() => {
    async function fetchMenu() {
      setLoadingMenu(true);
      const { data, error } = await supabase
        .from("menu_items")
        .select("id, name, description, price, category")
        .eq("available", true)
        .order("category");
      if (!error && data) setMenuItems(data);
      setLoadingMenu(false);
    }
    fetchMenu();
  }, []);

  const categories = [...new Set(menuItems.map((item) => item.category))];

  const itemCount = Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  const total = menuItems.reduce(
    (sum, item) => sum + (cart[item.id] ?? 0) * item.price,
    0
  );

  const handleAddToCart = (id: string) => {
    setOrderPlaced(false);
    setError(null);
    setCart((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }));
  };

  const handlePlaceOrder = async () => {
    if (itemCount === 0) return;
    if (!session || !session.id) {
      setError("Order could not be placed. Please try again.");
      return;
    }

    setSaving(true);
    setError(null);
    setOrderPlaced(false);

    try {
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          session_id: session.id,
          hotel_id: (session as any).hotel_id ?? null,
          status: "pending",
          total,
        })
        .select("id")
        .single();

      if (orderError || !order) throw orderError ?? new Error("Order insert failed");

      const itemsPayload = menuItems.flatMap((item) => {
        const qty = cart[item.id] ?? 0;
        if (qty <= 0) return [];
        return Array.from({ length: qty }).map(() => ({
          order_id: order.id,
          item_name: item.name,
          price: item.price,
          quantity: 1,
          category: item.category,
        }));
      });

      if (itemsPayload.length === 0) throw new Error("No order items to save");

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(itemsPayload);

      if (itemsError) throw itemsError;

      setOrderPlaced(true);
      setCart({});
    } catch (e) {
      console.error("[SuiteLuxe] Failed to place dining order:", e);
      setError("Order could not be placed. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="flex min-h-screen flex-col px-4 py-6 sm:px-8 sm:py-8"
      style={{ backgroundColor: "#0D1B2A" }}
    >
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
            Dining
          </h1>
          <p
            className="text-xs font-medium uppercase tracking-[0.25em]"
            style={{ color: "#C9993F" }}
          >
            Order to your room
          </p>
        </div>
      </header>

      <main className="mx-auto mt-8 flex w-full max-w-5xl flex-1 flex-col gap-8">
        {loadingMenu ? (
          <p className="text-white/60 text-sm">Loading menu...</p>
        ) : (
          categories.map((category) => (
            <section key={category}>
              <h2
                className="mb-4 text-xs font-semibold uppercase tracking-[0.25em]"
                style={{ color: "#C9993F" }}
              >
                {category}
              </h2>
              <div className="grid gap-5 sm:grid-cols-2">
                {menuItems
                  .filter((item) => item.category === category)
                  .map((item) => (
                    <div
                      key={item.id}
                      className="flex h-full flex-col justify-between rounded-2xl bg-[#162233] p-5 text-white shadow-lg"
                    >
                      <div>
                        <h3 className="text-lg font-semibold sm:text-xl">
                          {item.name}
                        </h3>
                        <p className="mt-2 text-sm text-white/70">
                          {item.description}
                        </p>
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                        <span
                          className="text-base font-semibold"
                          style={{ color: "#C9993F" }}
                        >
                          ${item.price}
                          {cart[item.id] > 0 && (
                            <span className="ml-2 text-xs text-white/50">
                              × {cart[item.id]}
                            </span>
                          )}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleAddToCart(item.id)}
                          className="rounded-full bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white outline-none transition hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-[#C9993F]"
                        >
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </section>
          ))
        )}
      </main>

      <footer className="mx-auto mt-8 w-full max-w-5xl border-t border-white/10 pt-4">
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div className="text-sm text-white/80">
            <span className="font-semibold">
              {itemCount} item{itemCount === 1 ? "" : "s"} in cart
            </span>
            <span className="ml-3 text-white/60">
              Total:{" "}
              <span className="font-semibold" style={{ color: "#C9993F" }}>
                ${total.toFixed(2)}
              </span>
            </span>
          </div>
          <button
            type="button"
            onClick={handlePlaceOrder}
            disabled={itemCount === 0 || saving}
            className="w-full rounded-full px-6 py-2.5 text-center text-xs font-semibold uppercase tracking-[0.2em] text-[#0D1B2A] outline-none transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            style={{ backgroundColor: "#C9993F" }}
          >
            {saving ? "Placing order..." : "Place Order"}
          </button>
        </div>

        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

        {orderPlaced && (
          <p className="mt-3 text-sm text-emerald-300">
            Your order has been placed! Estimated delivery: 30 minutes.
          </p>
        )}
      </footer>
    </div>
  );
}