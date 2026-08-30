"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Microscope, CheckCircle, Clock, HandHelping, History, AlertTriangle } from "lucide-react";
import Link from "next/link";

interface FacultyBorrow {
  id: string;
  status: string;
  request_type: string;
  borrow_date: string | null;
  return_date: string | null;
  created_at: string;
  borrow_items: { equipment: { name: string } | null }[] | null;
}

interface FacultyNotification {
  id: string;
  title: string;
  message: string | null;
}

export default function FacultyDashboardPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [userDept, setUserDept] = useState("");
  const [stats, setStats] = useState({ total: 0, available: 0, active: 0, faculty: 0, overdue: 0 });
  const [recentBorrows, setRecentBorrows] = useState<FacultyBorrow[]>([]);
  const [categories, setCategories] = useState<{ name: string; count: number }[]>([]);
  const [maxCat, setMaxCat] = useState(1);
  const [notifications, setNotifications] = useState<FacultyNotification[]>([]);

  const CAT_COLORS = ["#378ADD", "#1D9E75", "#7F77DD", "#BA7517", "#D85A30", "#888780"];

  const fetchAll = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase.from("users").select("full_name, department").eq("id", user.id).single();
    const name = profile?.full_name || "Faculty";
    const dept = profile?.department;
    setUserName(name.split(" ")[0]);
    setUserDept(dept || "");

    let totalQuery = supabase.from("equipment").select("*", { count: "exact", head: true });
    let availableQuery = supabase.from("equipment").select("*", { count: "exact", head: true }).eq("status", "available");
    if (dept) {
      totalQuery = totalQuery.eq("department", dept);
      availableQuery = availableQuery.eq("department", dept);
    }

    const [{ count: total }, { count: available }] = await Promise.all([totalQuery, availableQuery]);

    const { data: borrows } = await supabase.from("borrow_requests").select("*, borrow_items(equipment_id, quantity, equipment:equipment_id(name))").eq("user_id", user.id).order("created_at", { ascending: false });
    const active = borrows?.filter((b: FacultyBorrow) => b.status === "borrowed" || b.status === "approved").length || 0;
    const overdue = borrows?.filter((b: FacultyBorrow) => b.status === "borrowed" && new Date(b.borrow_date || "").getTime() + 3 * 60 * 60 * 1000 < Date.now()).length || 0;
    const faculty = borrows?.filter((b: FacultyBorrow) => b.request_type === "faculty").length || 0;

    setStats({ total: total || 0, available: available || 0, active, faculty, overdue });
    setRecentBorrows(borrows?.slice(0, 5) || []);

    const { data: cats } = await supabase.from("categories").select("id, name");
    if (cats) {
      const catData = await Promise.all(cats.map(async (c: { id: string; name: string }) => {
        let catQuery = supabase.from("equipment").select("*", { count: "exact", head: true }).eq("category_id", c.id);
        if (dept) catQuery = catQuery.eq("department", dept);
        const { count } = await catQuery;
        return { name: c.name, count: count || 0 };
      }));
      const filtered = catData.filter((c: { name: string; count: number }) => c.count > 0).sort((a, b) => b.count - a.count).slice(0, 6);
      setCategories(filtered);
      setMaxCat(Math.max(...filtered.map((c: { name: string; count: number }) => c.count), 1));
    }

    const { data: notifs } = await supabase.from("notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(4);
    setNotifications(notifs || []);

    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    void (async () => {
      await fetchAll();
    })();
  }, [fetchAll]);

  useEffect(() => {
    const channel = supabase
      .channel('faculty-dashboard-equipment')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'equipment' }, () => fetchAll())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase, fetchAll]);

  useEffect(() => {
    const channel = supabase
      .channel('faculty-dashboard-borrow-requests')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'borrow_requests' }, () => fetchAll())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase, fetchAll]);

  if (loading) {
    return (
      <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <div className="mb-[22px] h-[88px] animate-pulse rounded-xl border border-[#dde4ec] bg-white" />
        <div className="mb-[22px] grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-[#dde4ec] bg-white p-5">
              <div className="mb-3 h-2.5 w-1/2 animate-pulse rounded bg-[#e2e8f0]" />
              <div className="mb-2.5 h-6 w-3/4 animate-pulse rounded bg-[#e2e8f0]" />
              <div className="h-2 w-2/3 animate-pulse rounded bg-[#e2e8f0]" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-[18px] lg:grid-cols-[1fr_380px]">
          <div className="h-[220px] animate-pulse rounded-xl bg-[#e2e8f0]" />
          <div className="flex flex-col gap-3.5">
            <div className="h-[160px] animate-pulse rounded-xl bg-[#e2e8f0]" />
            <div className="h-[200px] animate-pulse rounded-xl bg-[#e2e8f0]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Welcome Banner */}
      <div className="relative mb-[22px] flex items-center justify-between gap-5 overflow-hidden rounded-xl border border-[#dde4ec] bg-white p-[22px_28px] shadow-sm">
        <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l bg-gradient-to-b from-[#0ea5a0] to-[#1b2b40]" />
        <div className="flex-1">
          <h3 className="mb-1 text-xl font-bold text-[#1b2b40]">Hello, {userName}! 👋</h3>
          <p className="text-[0.83rem] text-[#8fa1b3]">
            {userDept || "Faculty"} — Manage your laboratory activities and equipment borrowings
          </p>
          <div className="mt-3.5 flex flex-wrap gap-2">
            <Link href="/faculty/borrow" className="inline-flex items-center gap-1.5 rounded-lg bg-[#1b2b40] px-4 py-2 text-xs font-semibold text-white no-underline transition-colors hover:bg-[#0ea5a0]">
              <HandHelping className="h-3.5 w-3.5" /> Borrow Equipment
            </Link>
            <Link href="/faculty/equipment" className="inline-flex items-center gap-1.5 rounded-lg border border-[#dde4ec] bg-transparent px-4 py-2 text-xs font-semibold text-[#1b2b40] no-underline transition-colors hover:border-[#0ea5a0] hover:text-[#0ea5a0]">
              <Microscope className="h-3.5 w-3.5" /> Browse Equipment
            </Link>
            <Link href="/faculty/damage-reports" className="inline-flex items-center gap-1.5 rounded-lg border border-[#dde4ec] bg-transparent px-4 py-2 text-xs font-semibold text-[#1b2b40] no-underline transition-colors hover:border-[#0ea5a0] hover:text-[#0ea5a0]">
              <AlertTriangle className="h-3.5 w-3.5" /> Damage Reports
            </Link>
          </div>
        </div>
        <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-xl bg-[#e0f7f6] text-[#0ea5a0] text-2xl">
          {userDept === "Science" ? <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"/></svg> : <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="mb-[22px] grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-4">
        {[
          { label: "Total Equipment", sub: "In the laboratory", value: stats.total, icon: Microscope, color: "blue", iconBg: "#eff6ff", iconColor: "#3b82f6" },
          { label: "Available", sub: "Ready for use", value: stats.available, icon: CheckCircle, color: "green", iconBg: "#ecfdf5", iconColor: "#10b981" },
          { label: "Active Borrowings", sub: "Currently borrowed", value: stats.active, icon: Clock, color: "amber", iconBg: "#fffbeb", iconColor: "#f59e0b" },
          { label: "Faculty Borrows", sub: "My direct borrowings", value: stats.faculty, icon: HandHelping, color: "teal", iconBg: "#e0f7f6", iconColor: "#0ea5a0" },
        ].map((s) => (
          <div
            key={s.label}
            className="group relative block cursor-pointer overflow-hidden rounded-xl border border-[#dde4ec] bg-white p-[18px_20px] shadow-sm no-underline transition-all hover:-translate-y-[3px] hover:border-transparent hover:shadow-md"
          >
            <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t opacity-0 transition-opacity group-hover:opacity-100" style={{ background: s.iconColor }} />
            <div className="mb-3 flex h-[38px] w-[38px] items-center justify-center rounded-lg text-[0.95rem]" style={{ background: s.iconBg, color: s.iconColor }}>
              <s.icon className="h-[18px] w-[18px]" />
            </div>
            <div className="text-[1.7rem] font-bold leading-none text-[#1b2b40]">{stats.total > 0 || s.label !== "Total Equipment" ? s.value : stats.total}</div>
            <div className="mt-1 text-[0.73rem] font-medium text-[#8fa1b3]">{s.label}</div>
            <div className="mt-0.5 text-[0.7rem] text-[#8fa1b3]">{s.sub}</div>
          </div>
        ))}
      </div>

      {stats.overdue > 0 && (
        <div className="mb-4 flex items-start gap-3 rounded-[10px] border border-[#fca5a5] bg-[#fef2f2] p-[14px_16px]">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#ef4444]" />
          <div>
            <p className="text-[0.8rem] leading-relaxed text-[#991b1b]">
              You have {stats.overdue} overdue borrow{stats.overdue > 1 ? "s" : ""}. Please return the equipment as soon as possible.
            </p>
            <Link href="/faculty/history?status=overdue" className="text-[0.76rem] font-semibold text-[#ef4444] no-underline hover:underline">
              View details →
            </Link>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-[18px] lg:grid-cols-[1fr_380px]">
        {/* Left: Recent Borrowings + Category Chart */}
        <div>
          <div className="overflow-hidden rounded-xl border border-[#dde4ec] bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-[#dde4ec] px-5 py-3.5">
              <h5 className="m-0 flex items-center gap-2 text-[0.9rem] font-bold text-[#1b2b40]">
                <History className="h-3.5 w-3.5 text-[#8fa1b3]" /> Recent Borrowings
              </h5>
              <Link href="/faculty/history" className="text-[0.76rem] font-semibold text-[#0ea5a0] no-underline hover:underline">
                View all →
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[#f2f5f9] text-left">
                    {["Equipment", "Borrowed", "Expected Return", "Status", "Action"].map((h) => (
                      <th key={h} className="px-2.5 py-2 text-[0.68rem] font-semibold uppercase tracking-wider text-[#8fa1b3]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentBorrows.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-[0.82rem] text-[#8fa1b3]">
                        <Microscope className="mx-auto mb-2 h-7 w-7 text-[#dde4ec]" />
                        No recent borrowings
                      </td>
                    </tr>
                  ) : (
                    recentBorrows.map((b: FacultyBorrow) => (
                      <tr key={b.id} className="hover:bg-[#f8fafb]">
                        <td className="border-b border-[#dde4ec] px-2.5 py-2.5 text-[0.8rem]">
                          <div className="font-semibold text-[#1b2b40]">
                            {b.borrow_items?.[0]?.equipment?.name || `Request #${b.id.slice(0, 6)}`}
                          </div>
                        </td>
                        <td className="border-b border-[#dde4ec] px-2.5 py-2.5 text-[0.8rem] text-[#4a5e74]">
                          {new Date(b.borrow_date || b.created_at).toLocaleDateString()}
                        </td>
                        <td className="border-b border-[#dde4ec] px-2.5 py-2.5 text-[0.8rem] text-[#4a5e74]">
                          {b.return_date ? new Date(b.return_date).toLocaleDateString() : "—"}
                        </td>
                        <td className="border-b border-[#dde4ec] px-2.5 py-2.5">
                          <span className={`inline-flex items-center gap-1 rounded-[10px] px-2.5 py-0.5 text-[0.68rem] font-bold ${
                            b.status === "borrowed" ? "bg-[#eff6ff] text-[#1d4ed8]" :
                            b.status === "returned" ? "bg-[#ecfdf5] text-[#065f46]" :
                            b.status === "overdue" ? "bg-[#fef2f2] text-[#991b1b]" :
                            "bg-[#fffbeb] text-[#92400e]"
                          }`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${
                              b.status === "borrowed" ? "bg-[#1d4ed8]" :
                              b.status === "returned" ? "bg-[#065f46]" :
                              b.status === "overdue" ? "bg-[#991b1b]" :
                              "bg-[#92400e]"
                            }`} />
                            {b.status}
                          </span>
                        </td>
                        <td className="border-b border-[#dde4ec] px-2.5 py-2.5">
                          {b.status === "borrowed" && (
                            <Link href="/faculty/history" className="inline-flex items-center gap-1 rounded-md border border-[#d1fae5] bg-[#f0fdf4] px-2.5 py-1 text-[0.68rem] font-semibold text-[#065f46] no-underline transition-colors hover:bg-[#d1fae5]">
                              <CheckCircle className="h-3 w-3" /> Return
                            </Link>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Category bars */}
          {categories.length > 0 && (
            <div className="mt-[18px] overflow-hidden rounded-xl border border-[#dde4ec] bg-white shadow-sm">
              <div className="border-b border-[#dde4ec] px-5 py-3.5">
                <h5 className="m-0 flex items-center gap-2 text-[0.9rem] font-bold text-[#1b2b40]">
                  <Microscope className="h-3.5 w-3.5 text-[#8fa1b3]" /> Equipment by Category
                </h5>
              </div>
              <div className="px-5 py-4">
                {categories.map((c: { name: string; count: number }, i: number) => (
                  <div key={c.name} className="mb-2.5 flex items-center gap-2.5">
                    <span className="w-[110px] shrink-0 overflow-hidden text-ellipsis whitespace-nowrap text-[0.73rem] text-[#4a5e74]">{c.name}</span>
                    <div className="h-[7px] flex-1 overflow-hidden rounded bg-[#f2f5f9]">
                      <div
                        className="h-full rounded transition-all duration-600"
                        style={{ width: `${(c.count / maxCat) * 100}%`, background: CAT_COLORS[i % CAT_COLORS.length] }}
                      />
                    </div>
                    <span className="w-[26px] shrink-0 text-right font-mono text-[0.7rem] text-[#8fa1b3]">{c.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div className="flex flex-col gap-[18px]">
          {/* Quick Stats */}
          <div className="overflow-hidden rounded-xl border border-[#dde4ec] bg-white shadow-sm">
            <div className="border-b border-[#dde4ec] px-5 py-3.5">
              <h5 className="m-0 flex items-center gap-2 text-[0.9rem] font-bold text-[#1b2b40]">
                <Clock className="h-3.5 w-3.5 text-[#8fa1b3]" /> Quick Stats
              </h5>
            </div>
            <div className="grid grid-cols-2 gap-2.5 p-4">
              {[
                { num: stats.active, label: "Active" },
                { num: stats.faculty, label: "Total Borrows" },
              ].map((s) => (
                <div key={s.label} className="rounded-lg border border-[#dde4ec] bg-[#f2f5f9] p-3">
                  <div className="text-[1.3rem] font-bold text-[#1b2b40]">{s.num}</div>
                  <div className="mt-0.5 text-[0.68rem] text-[#8fa1b3]">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Notifications */}
          <div className="overflow-hidden rounded-xl border border-[#dde4ec] bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-[#dde4ec] px-5 py-3.5">
              <h5 className="m-0 flex items-center gap-2 text-[0.9rem] font-bold text-[#1b2b40]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8fa1b3" strokeWidth="2"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
                Notifications
              </h5>
            </div>
            <div className="p-4">
              {notifications.length === 0 ? (
                <p className="py-4 text-center text-[0.8rem] text-[#8fa1b3]">No new notifications</p>
              ) : (
                notifications.map((n: FacultyNotification) => (
                  <div key={n.id} className="border-b border-[#dde4ec] py-2 last:border-0">
                    <div className="text-[0.8rem] font-semibold text-[#1b2b40]">{n.title}</div>
                    <div className="mt-1 text-[0.72rem] text-[#8fa1b3]">{n.message?.slice(0, 60)}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
