"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type AdminOrderItem = {
  item_name: string;
  price: number;
  quantity: number;
  category?: string | null;
};

type AdminOrder = {
  id: string;
  total: number;
  status: string;
  created_at: string;
  guest_sessions: {
    room_number: string;
    guest_name: string;
  } | null;
  order_items: AdminOrderItem[];
};

type ServiceRequest = {
  id: string;
  created_at: string;
  session_id: string | null;
  hotel_id: string | null;
  room_number: string | null;
  guest_name: string | null;
  request_type: string;
  status: "pending" | "in progress" | "completed";
  assigned_to: string | null;
  notes: string | null;
};

type StaffMember = {
  id: string;
  name: string;
  role: string;
};

type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  available: boolean;
};

type Promo = {
  id: string;
  label: string;
  headline: string;
  sub: string;
  cta: string;
  href: string;
  active: boolean;
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [updatingServiceId, setUpdatingServiceId] = useState<string | null>(null);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [hotelId, setHotelId] = useState<string | null>(null);
  const [newItem, setNewItem] = useState({ name: "", description: "", price: "", category: "mains" });
  const [savingMenu, setSavingMenu] = useState(false);
  const [menuSuccess, setMenuSuccess] = useState<string | null>(null);
  const [promo, setPromo] = useState<Promo | null>(null);
  const [promoForm, setPromoForm] = useState<Partial<Promo>>({});
  const [savingPromo, setSavingPromo] = useState(false);
  const [promoSuccess, setPromoSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const authed = localStorage.getItem("admin_authenticated");
      if (authed !== "true") {
        router.replace("/admin/login");
        return;
      }
    }

    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [
          { data, error: queryError },
          { data: requestsData, error: requestsError },
          { data: staffData, error: staffError },
          { data: menuData, error: menuError },
          { data: hotelData },
          { data: promoData },
        ] = await Promise.all([
          supabase.from("orders").select(`
            id, total, status, created_at,
            guest_sessions:session_id (room_number, guest_name),
            order_items (item_name, price, quantity, category)
          `).order("created_at", { ascending: false }),
          supabase.from("service_requests").select("*").order("created_at", { ascending: false }),
          supabase.from("staff").select("id, name, role").order("name"),
          supabase.from("menu_items").select("*").order("category"),
          supabase.from("hotels").select("id").limit(1).maybeSingle(),
          supabase.from("promos").select("*").limit(1).maybeSingle(),
        ]);

        if (queryError) throw queryError;
        if (requestsError) throw requestsError;
        if (staffError) throw staffError;
        if (menuError) throw menuError;

        setOrders((data as AdminOrder[]) ?? []);
        setServiceRequests((requestsData as ServiceRequest[]) ?? []);
        setStaff((staffData as StaffMember[]) ?? []);
        setMenuItems((menuData as MenuItem[]) ?? []);
        setHotelId(hotelData?.id ?? null);
        if (promoData) {
          setPromo(promoData as Promo);
          setPromoForm(promoData as Promo);
        }
      } catch (e) {
        console.error("[SuiteLuxe] Failed to load admin data:", e);
        setError("Unable to load data. Please refresh.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [router]);

  const todayStats = (() => {
    const now = new Date();
    const isToday = (iso: string) => {
      const d = new Date(iso);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
    };
    const todaysOrders = orders.filter((o) => isToday(o.created_at));
    const revenue = todaysOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
    const count = todaysOrders.length;
    const average = count > 0 ? revenue / count : 0;
    return { revenue, count, average };
  })();

  const handleUpdateStatus = async (orderId: string, nextStatus: string) => {
    try {
      setUpdatingId(orderId);
      const { error: updateError } = await supabase.from("orders").update({ status: nextStatus }).eq("id", orderId);
      if (updateError) throw updateError;
      setOrders((prev) => prev.map((order) => order.id === orderId ? { ...order, status: nextStatus } : order));
    } catch (e) {
      console.error("[SuiteLuxe] Failed to update order status:", e);
    } finally {
      setUpdatingId(null);
    }
  };

  const pendingServiceCount = serviceRequests.filter((r) => r.status === "pending").length;

  const cycleServiceStatus = (current: ServiceRequest["status"]) => {
    if (current === "pending") return "in progress";
    if (current === "in progress") return "completed";
    return "completed";
  };

  const handleUpdateServiceStatus = async (id: string) => {
    const req = serviceRequests.find((r) => r.id === id);
    if (!req) return;
    const nextStatus = cycleServiceStatus(req.status);
    try {
      setUpdatingServiceId(id);
      const { error: updateError } = await supabase.from("service_requests").update({ status: nextStatus }).eq("id", id);
      if (updateError) throw updateError;
      setServiceRequests((prev) => prev.map((r) => r.id === id ? { ...r, status: nextStatus } : r));
    } catch (e) {
      console.error("[SuiteLuxe] Failed to update service request:", e);
    } finally {
      setUpdatingServiceId(null);
    }
  };

  const handleAssignStaff = async (reqId: string, staffId: string) => {
    const { error } = await supabase.from("service_requests").update({ assigned_to: staffId || null }).eq("id", reqId);
    if (!error) {
      setServiceRequests((prev) => prev.map((r) => r.id === reqId ? { ...r, assigned_to: staffId || null } : r));
    }
  };

  const handleSaveNote = async (reqId: string) => {
    const note = notes[reqId] ?? "";
    const { error } = await supabase.from("service_requests").update({ notes: note }).eq("id", reqId);
    if (!error) {
      setServiceRequests((prev) => prev.map((r) => r.id === reqId ? { ...r, notes: note } : r));
      setNotes((prev) => { const next = { ...prev }; delete next[reqId]; return next; });
    }
  };

  const handleToggleAvailable = async (item: MenuItem) => {
    const { error } = await supabase.from("menu_items").update({ available: !item.available }).eq("id", item.id);
    if (!error) {
      setMenuItems((prev) => prev.map((m) => m.id === item.id ? { ...m, available: !m.available } : m));
    }
  };

  const handleDeleteMenuItem = async (id: string) => {
    const { error } = await supabase.from("menu_items").delete().eq("id", id);
    if (!error) {
      setMenuItems((prev) => prev.filter((m) => m.id !== id));
    }
  };

  const handleAddMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hotelId) return;
    setSavingMenu(true);
    setMenuSuccess(null);
    const { data, error } = await supabase.from("menu_items").insert({
      hotel_id: hotelId,
      name: newItem.name,
      description: newItem.description,
      price: parseFloat(newItem.price),
      category: newItem.category,
      available: true,
    }).select().single();
    if (!error && data) {
      setMenuItems((prev) => [...prev, data as MenuItem]);
      setNewItem({ name: "", description: "", price: "", category: "mains" });
      setMenuSuccess("Menu item added!");
      setTimeout(() => setMenuSuccess(null), 3000);
    }
    setSavingMenu(false);
  };

  const handleSavePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promo) return;
    setSavingPromo(true);
    setPromoSuccess(null);
    const { error } = await supabase.from("promos").update({
      label: promoForm.label,
      headline: promoForm.headline,
      sub: promoForm.sub,
      cta: promoForm.cta,
      href: promoForm.href,
      active: promoForm.active,
    }).eq("id", promo.id);
    if (!error) {
      setPromo({ ...promo, ...promoForm } as Promo);
      setPromoSuccess("Promo updated! Guests will see the new banner immediately.");
      setTimeout(() => setPromoSuccess(null), 4000);
    }
    setSavingPromo(false);
  };

  const categories = [...new Set(menuItems.map((m) => m.category))];

  return (
    <div className="min-h-screen px-4 py-6 sm:px-8 sm:py-8" style={{ backgroundColor: "#0D1B2A" }}>
      <header className="mx-auto flex w-full max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-normal text-white sm:text-3xl" style={{ fontFamily: "Georgia, serif" }}>Admin Dashboard</h1>
          <p className="mt-1 text-xs font-medium uppercase tracking-[0.25em]" style={{ color: "#C9993F" }}>
            Live Orders
            {pendingServiceCount > 0 && (
              <span className="ml-3 rounded-full bg-[#162233] px-2 py-0.5 text-[0.6rem] font-semibold tracking-[0.18em] text-white/80">
                {pendingServiceCount} Pending Requests
              </span>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={() => { if (typeof window !== "undefined") localStorage.removeItem("admin_authenticated"); router.replace("/admin/login"); }}
          className="rounded-full border border-white/25 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-white outline-none transition hover:border-[#C9993F] hover:text-[#C9993F]"
        >
          Sign Out
        </button>
      </header>

      <main className="mx-auto mt-8 w-full max-w-6xl">
        {/* Revenue summary */}
        <section className="grid gap-4 sm:grid-cols-3">
          {[
            { label: "Today's Revenue", value: `$${todayStats.revenue.toFixed(2)}` },
            { label: "Today's Orders", value: todayStats.count },
            { label: "Avg Order Value", value: `$${todayStats.average.toFixed(2)}` },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl px-4 py-3" style={{ backgroundColor: "#162233" }}>
              <p className="text-lg font-semibold" style={{ color: "#C9993F" }}>{stat.value}</p>
              <p className="mt-1 text-xs font-medium uppercase tracking-[0.18em] text-white/70">{stat.label}</p>
            </div>
          ))}
        </section>

        {loading && <p className="mt-4 text-sm text-white/70">Loading…</p>}
        {error && !loading && <p className="mt-4 text-sm text-red-400">{error}</p>}

        {/* Orders */}
        <div className="mt-4 grid gap-5 md:grid-cols-2">
          {orders.map((order) => {
            const guest = order.guest_sessions;
            const timeString = new Date(order.created_at).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
            return (
              <div key={order.id} className="flex flex-col rounded-2xl bg-[#162233] p-5 text-white shadow-lg">
                <div className="flex items-baseline justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-white/70">Room {guest?.room_number ?? "—"}</p>
                    <p className="text-base font-semibold">{guest?.guest_name ?? "Unknown guest"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold" style={{ color: "#C9993F" }}>${Number(order.total).toFixed(2)}</p>
                    <p className="mt-1 text-xs text-white/60">{timeString}</p>
                  </div>
                </div>
                <div className="mt-4 border-t border-white/10 pt-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/50">Items</p>
                  <ul className="mt-2 space-y-1 text-sm text-white/80">
                    {order.order_items?.map((item, index) => (
                      <li key={`${order.id}-${index}`} className="flex justify-between">
                        <span>{item.item_name}{item.quantity > 1 && <span className="text-white/50"> ×{item.quantity}</span>}</span>
                        <span className="text-white/70">${Number(item.price).toFixed(2)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
                  <div>
                    {order.status === "pending" && <span className="rounded-full bg-yellow-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-yellow-300">Pending</span>}
                    {order.status === "preparing" && <span className="rounded-full bg-orange-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-orange-300">Preparing</span>}
                    {order.status === "delivered" && <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">Delivered</span>}
                  </div>
                  <div>
                    {order.status === "pending" && (
                      <button type="button" onClick={() => handleUpdateStatus(order.id, "preparing")} disabled={updatingId === order.id} className="rounded-full bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-white outline-none transition hover:bg-white/10 disabled:opacity-60">
                        {updatingId === order.id ? "Updating…" : "Mark Preparing"}
                      </button>
                    )}
                    {order.status === "preparing" && (
                      <button type="button" onClick={() => handleUpdateStatus(order.id, "delivered")} disabled={updatingId === order.id} className="rounded-full bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-white outline-none transition hover:bg-white/10 disabled:opacity-60">
                        {updatingId === order.id ? "Updating…" : "Mark Delivered"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Service requests */}
        <section className="mt-10">
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-white/70">Service Requests</h2>
          {serviceRequests.length === 0 ? (
            <p className="mt-3 text-sm text-white/60">No service requests at the moment.</p>
          ) : (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {serviceRequests.map((req) => {
                const timeString = new Date(req.created_at).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
                const assignedStaff = staff.find((s) => s.id === req.assigned_to);
                return (
                  <div key={req.id} className="flex flex-col rounded-2xl bg-[#162233] p-5 text-white shadow-lg">
                    <div className="flex items-baseline justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-white/70">Room {req.room_number ?? "—"}</p>
                        <p className="text-base font-semibold">{req.guest_name ?? "Unknown guest"}</p>
                        <p className="mt-1 text-sm text-white/70">{req.request_type}</p>
                      </div>
                      <div className="text-right text-xs text-white/60">{timeString}</div>
                    </div>
                    <div className="mt-3">
                      <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-white/50">Assign to</label>
                      <select
                        value={req.assigned_to ?? ""}
                        onChange={(e) => handleAssignStaff(req.id, e.target.value)}
                        className="w-full rounded border border-white/20 bg-[#0D1B2A] px-3 py-1.5 text-sm text-white outline-none focus:border-[#C9993F]"
                      >
                        <option value="">Unassigned</option>
                        {staff.map((s) => (
                          <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                        ))}
                      </select>
                      {assignedStaff && <p className="mt-1 text-xs text-emerald-400">Assigned to {assignedStaff.name}</p>}
                    </div>
                    <div className="mt-3">
                      <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-white/50">Notes</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={notes[req.id] ?? req.notes ?? ""}
                          onChange={(e) => setNotes((prev) => ({ ...prev, [req.id]: e.target.value }))}
                          placeholder="Add a note…"
                          className="flex-1 rounded border border-white/20 bg-[#0D1B2A] px-3 py-1.5 text-sm text-white placeholder-white/30 outline-none focus:border-[#C9993F]"
                        />
                        <button type="button" onClick={() => handleSaveNote(req.id)} className="rounded border border-white/20 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-white/70 transition hover:border-[#C9993F] hover:text-[#C9993F]">
                          Save
                        </button>
                      </div>
                      {req.notes && <p className="mt-1 text-xs text-white/40">Saved: {req.notes}</p>}
                    </div>
                    <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
                      <div>
                        {req.status === "pending" && <span className="rounded-full bg-yellow-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-yellow-300">Pending</span>}
                        {req.status === "in progress" && <span className="rounded-full bg-orange-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-orange-300">In Progress</span>}
                        {req.status === "completed" && <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">Completed</span>}
                      </div>
                      {req.status !== "completed" && (
                        <button type="button" onClick={() => handleUpdateServiceStatus(req.id)} disabled={updatingServiceId === req.id} className="rounded-full bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-white outline-none transition hover:bg-white/10 disabled:opacity-60">
                          {updatingServiceId === req.id ? "Updating…" : "Advance Status"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Menu Management */}
        <section className="mt-10">
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-white/70">Menu Management</h2>
          <div className="mt-4 rounded-2xl bg-[#162233] p-5">
            <h3 className="mb-4 text-sm font-semibold text-white">Add New Item</h3>
            <form onSubmit={handleAddMenuItem} className="grid gap-3 sm:grid-cols-2">
              <input type="text" value={newItem.name} onChange={(e) => setNewItem((prev) => ({ ...prev, name: e.target.value }))} required placeholder="Item name" className="rounded border border-white/20 bg-[#0D1B2A] px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-[#C9993F]" />
              <input type="text" value={newItem.description} onChange={(e) => setNewItem((prev) => ({ ...prev, description: e.target.value }))} placeholder="Description" className="rounded border border-white/20 bg-[#0D1B2A] px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-[#C9993F]" />
              <input type="number" value={newItem.price} onChange={(e) => setNewItem((prev) => ({ ...prev, price: e.target.value }))} required placeholder="Price e.g. 18.00" step="0.01" min="0" className="rounded border border-white/20 bg-[#0D1B2A] px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-[#C9993F]" />
              <select value={newItem.category} onChange={(e) => setNewItem((prev) => ({ ...prev, category: e.target.value }))} className="rounded border border-white/20 bg-[#0D1B2A] px-3 py-2 text-sm text-white outline-none focus:border-[#C9993F]">
                <option value="breakfast">Breakfast</option>
                <option value="mains">Mains</option>
                <option value="desserts">Desserts</option>
                <option value="drinks">Drinks</option>
              </select>
              <button type="submit" disabled={savingMenu} className="sm:col-span-2 rounded-full px-4 py-2 text-sm font-semibold uppercase tracking-wider text-[#0D1B2A] transition hover:opacity-95 disabled:opacity-60" style={{ backgroundColor: "#C9993F" }}>
                {savingMenu ? "Adding…" : "Add to Menu"}
              </button>
              {menuSuccess && <p className="sm:col-span-2 text-sm text-emerald-300">{menuSuccess}</p>}
            </form>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {categories.map((category) => (
              <div key={category} className="rounded-2xl bg-[#162233] p-5">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.25em]" style={{ color: "#C9993F" }}>{category}</h3>
                <ul className="space-y-3">
                  {menuItems.filter((m) => m.category === category).map((item) => (
                    <li key={item.id} className="flex items-center justify-between gap-3 text-sm text-white">
                      <div className="flex-1">
                        <p className={item.available ? "font-medium" : "font-medium text-white/40 line-through"}>{item.name}</p>
                        <p className="text-xs text-white/50">${item.price}</p>
                      </div>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => handleToggleAvailable(item)} className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider transition ${item.available ? "bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30" : "bg-white/10 text-white/50 hover:bg-white/20"}`}>
                          {item.available ? "Live" : "Off"}
                        </button>
                        <button type="button" onClick={() => handleDeleteMenuItem(item.id)} className="rounded-full bg-red-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-red-300 transition hover:bg-red-500/30">
                          Delete
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Promo Banner Editor */}
        <section className="mt-10">
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-white/70">Promo Banner</h2>
          <p className="mt-1 text-xs text-white/40">Changes appear instantly on the guest dashboard.</p>
          <div className="mt-4 rounded-2xl bg-[#162233] p-5">
            <form onSubmit={handleSavePromo} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-white/50">Label</label>
                  <input
                    type="text"
                    value={promoForm.label ?? ""}
                    onChange={(e) => setPromoForm((prev) => ({ ...prev, label: e.target.value }))}
                    placeholder="e.g. Limited Time Offer"
                    className="w-full rounded border border-white/20 bg-[#0D1B2A] px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-[#C9993F]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-white/50">Headline</label>
                  <input
                    type="text"
                    value={promoForm.headline ?? ""}
                    onChange={(e) => setPromoForm((prev) => ({ ...prev, headline: e.target.value }))}
                    placeholder="e.g. 20% Off Spa Treatments"
                    className="w-full rounded border border-white/20 bg-[#0D1B2A] px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-[#C9993F]"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-white/50">Description</label>
                <input
                  type="text"
                  value={promoForm.sub ?? ""}
                  onChange={(e) => setPromoForm((prev) => ({ ...prev, sub: e.target.value }))}
                  placeholder="e.g. Book any treatment this week and save."
                  className="w-full rounded border border-white/20 bg-[#0D1B2A] px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-[#C9993F]"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-white/50">Button Text</label>
                  <input
                    type="text"
                    value={promoForm.cta ?? ""}
                    onChange={(e) => setPromoForm((prev) => ({ ...prev, cta: e.target.value }))}
                    placeholder="e.g. Book Now"
                    className="w-full rounded border border-white/20 bg-[#0D1B2A] px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-[#C9993F]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-white/50">Button Link</label>
                  <select
                    value={promoForm.href ?? "/spa"}
                    onChange={(e) => setPromoForm((prev) => ({ ...prev, href: e.target.value }))}
                    className="w-full rounded border border-white/20 bg-[#0D1B2A] px-3 py-2 text-sm text-white outline-none focus:border-[#C9993F]"
                  >
                    <option value="/spa">Spa</option>
                    <option value="/dining">Dining</option>
                    <option value="/upgrade">Upgrade</option>
                    <option value="/service">Service</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="promo-active"
                  checked={promoForm.active ?? true}
                  onChange={(e) => setPromoForm((prev) => ({ ...prev, active: e.target.checked }))}
                  className="h-4 w-4 accent-[#C9993F]"
                />
                <label htmlFor="promo-active" className="text-sm text-white/70">Show banner to guests</label>
              </div>
              <button
                type="submit"
                disabled={savingPromo}
                className="w-full rounded-full px-4 py-2.5 text-sm font-semibold uppercase tracking-wider text-[#0D1B2A] transition hover:opacity-95 disabled:opacity-60"
                style={{ backgroundColor: "#C9993F" }}
              >
                {savingPromo ? "Saving…" : "Save Promo"}
              </button>
              {promoSuccess && <p className="text-sm text-emerald-300">{promoSuccess}</p>}
            </form>
          </div>
        </section>
      </main>
    </div>
  );
}