"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Microscope, PackageCheck, Clock, AlertTriangle, HandHelping, Tags, GraduationCap, FileText } from "lucide-react";
import Link from "next/link";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";

interface RecentBorrow {
  id: string;
  request_type: string;
  status: string;
  created_at: string;
  users: { full_name: string | null } | null;
}

interface RecentActivity {
  id: string;
  action: string;
  entity_type: string | null;
  created_at: string;
  users: { full_name: string | null } | null;
}

export default function AdminDashboardPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, available: 0, borrowed: 0, maintenance: 0 });
  const [categoryChart, setCategoryChart] = useState<{ name: string; count: number }[]>([]);
  const [statusChart, setStatusChart] = useState<{ name: string; value: number }[]>([]);
  const [recentBorrows, setRecentBorrows] = useState<RecentBorrow[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);

  const COLORS = ["#0ea5a0", "#3b82f6", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6"];

  const fetchAll = async () => {
    const { count: total } = await supabase.from("equipment").select("*", { count: "exact", head: true });
    const { count: available } = await supabase.from("equipment").select("*", { count: "exact", head: true }).eq("status", "available");
    const { count: borrowed } = await supabase.from("equipment").select("*", { count: "exact", head: true }).eq("status", "borrowed");
    const { count: maintenance } = await supabase.from("equipment").select("*", { count: "exact", head: true }).eq("status", "damaged");
    setStats({ total: total || 0, available: available || 0, borrowed: borrowed || 0, maintenance: maintenance || 0 });

    const { data: cats } = await supabase.from("categories").select("id, name");
    if (cats) {
      const cd = await Promise.all(cats.map(async (c: { id: string; name: string }) => {
        const { count } = await supabase.from("equipment").select("*", { count: "exact", head: true }).eq("category_id", c.id);
        return { name: c.name, count: count || 0 };
      }));
      setCategoryChart(cd.filter((c: { name: string; count: number }) => c.count > 0));
    }

    setStatusChart([
      { name: "Available", value: available || 0 },
      { name: "Borrowed", value: borrowed || 0 },
      { name: "Damaged", value: maintenance || 0 },
    ]);

    const { data: borrows } = await supabase.from("borrow_requests").select("*, users!borrow_requests_user_id_fkey(full_name)").order("created_at", { ascending: false }).limit(5);
    setRecentBorrows(borrows || []);

    const { data: logs } = await supabase.from("activity_logs").select("*, users(full_name)").order("created_at", { ascending: false }).limit(8);
    setRecentActivity(logs || []);

    setLoading(false);
  };

  useEffect(() => {
    void (async () => {
      await fetchAll();
    })();
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel('admin-dashboard-equipment')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'equipment' }, () => fetchAll())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel('admin-dashboard-borrow-requests')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'borrow_requests' }, () => fetchAll())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Page Header */}
      <div className="mb-[22px] flex flex-wrap items-center justify-between gap-3.5 rounded-xl border border-[#dde4ec] bg-white p-4 shadow-sm">
        <div>
          <h2 className="m-0 flex items-center gap-2.5 text-lg font-bold text-[#1b2b40]">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#e0f7f6] text-[#0ea5a0]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
            </span>
            Dashboard Overview
          </h2>
          <p className="m-0 text-[0.8rem] text-[#8fa1b3]">Laboratory inventory at a glance</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="mb-[22px] grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Equipment", value: stats.total, icon: Microscope, color: "navy", bg: "#e8ecf2", fg: "#1b2b40" },
          { label: "Available", value: stats.available, icon: PackageCheck, color: "teal", bg: "#e0f7f6", fg: "#0ea5a0" },
          { label: "Borrowed", value: stats.borrowed, icon: Clock, color: "amber", bg: "#fef3c7", fg: "#f59e0b" },
          { label: "Damaged", value: stats.maintenance, icon: AlertTriangle, color: "red", bg: "#fee2e2", fg: "#ef4444" },
        ].map((s) => (
          <div key={s.label} className="group flex cursor-pointer items-center gap-3.5 rounded-xl border border-[#dde4ec] bg-white p-[18px_20px] shadow-sm no-underline transition-all hover:-translate-y-[3px] hover:shadow-md">
            {loading ? (
              <div className="h-[50px] w-[50px] animate-pulse rounded-xl bg-[#e2e8f0]" />
            ) : (
              <div className="flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-xl text-xl" style={{ background: s.bg, color: s.fg }}>
                <s.icon className="h-5 w-5" />
              </div>
            )}
            <div>
              {loading ? (
                <div className="space-y-2">
                  <div className="h-7 w-12 animate-pulse rounded bg-[#e2e8f0]" />
                  <div className="h-3 w-20 animate-pulse rounded bg-[#e2e8f0]" />
                </div>
              ) : (
                <>
                  <div className="text-[1.7rem] font-extrabold leading-none text-[#1b2b40]">{s.value}</div>
                  <div className="mt-1 text-[0.68rem] font-semibold uppercase tracking-wider text-[#8fa1b3]">{s.label}</div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="mb-[22px] grid grid-cols-1 gap-[18px] lg:grid-cols-2">
        {/* Category Donut */}
        <div className="overflow-hidden rounded-xl border border-[#dde4ec] bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-[#dde4ec] px-5 py-3.5" style={{ background: "linear-gradient(135deg, #1b2b40 0%, #253348 100%)" }}>
            <h5 className="m-0 flex items-center gap-2 text-[0.85rem] font-bold text-white/90">
              <Tags className="h-3.5 w-3.5" /> Equipment by Category
            </h5>
          </div>
          <div className="p-5">
            {loading ? (
              <div className="flex h-[270px] items-center justify-center">
                <div className="h-[180px] w-[180px] animate-pulse rounded-full bg-[#e2e8f0]" />
              </div>
            ) : (
              <div className="h-[270px]">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={categoryChart} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="count" label={({ name, value }: { name?: string; value?: number | string }) => `${name}: ${value}`}>
                      {categoryChart.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Status Bar */}
        <div className="overflow-hidden rounded-xl border border-[#dde4ec] bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-[#dde4ec] px-5 py-3.5" style={{ background: "linear-gradient(135deg, #1b2b40 0%, #253348 100%)" }}>
            <h5 className="m-0 flex items-center gap-2 text-[0.85rem] font-bold text-white/90">
              <Microscope className="h-3.5 w-3.5" /> Equipment by Status
            </h5>
          </div>
          <div className="p-5">
            {loading ? (
              <div className="h-[270px] animate-pulse rounded bg-[#e2e8f0]" />
            ) : (
              <div className="h-[270px]">
                <ResponsiveContainer>
                  <BarChart data={statusChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#dde4ec" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#8fa1b3" }} />
                    <YAxis tick={{ fontSize: 11, fill: "#8fa1b3" }} />
                    <Tooltip />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {statusChart.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-[22px] grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Borrow Equipment", icon: HandHelping, href: "/admin/borrow-requests" },
          { label: "Add Equipment", icon: Microscope, href: "/admin/equipment" },
          { label: "Manage Students", icon: GraduationCap, href: "/admin/students" },
          { label: "View Reports", icon: FileText, href: "/admin/activity-logs" },
        ].map((a) => (
          <Link
            key={a.label}
            href={a.href}
            className="flex flex-col items-center gap-2.5 rounded-lg border border-[#dde4ec] bg-[#f2f5f9] p-5 text-center no-underline transition-all hover:-translate-y-[3px] hover:border-[#0ea5a0] hover:bg-[#0ea5a0] hover:text-white hover:shadow-lg"
          >
            <div className="flex h-[46px] w-[46px] items-center justify-center rounded-[10px] bg-white text-xl text-[#4a5e74] transition-colors group-hover:bg-white/20 group-hover:text-white">
              <a.icon className="h-5 w-5" />
            </div>
            <span className="text-[0.79rem] font-semibold text-[#4a5e74] transition-colors group-hover:text-white">{a.label}</span>
          </Link>
        ))}
      </div>

      {/* Recent Borrowings */}
      <div className="mb-[22px] overflow-hidden rounded-xl border border-[#dde4ec] bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-[#dde4ec] px-5 py-3.5" style={{ background: "linear-gradient(135deg, #1b2b40 0%, #253348 100%)" }}>
          <h5 className="m-0 flex items-center gap-2 text-[0.85rem] font-bold text-white/90">
            <HandHelping className="h-3.5 w-3.5" /> Recent Borrowings
          </h5>
          <Link href="/admin/borrow-requests" className="rounded-xl bg-white/[0.15] px-2.5 py-[3px] text-[0.68rem] font-bold text-white/85 no-underline">View All</Link>
        </div>
        <div className="overflow-x-auto p-0">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#f2f5f9] text-left">
                {["User", "Type", "Status", "Date"].map((h) => (
                  <th key={h} className="px-2.5 py-2 text-[0.68rem] font-semibold uppercase tracking-wider text-[#8fa1b3]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentBorrows.length === 0 ? (
                <tr><td colSpan={4} className="py-8 text-center text-[0.82rem] text-[#8fa1b3]">No borrowings yet</td></tr>
              ) : (
                recentBorrows.map((b: RecentBorrow) => (
                  <tr key={b.id} className="hover:bg-[#f8fafb]">
                    <td className="border-b border-[#dde4ec] px-2.5 py-2.5 text-[0.8rem] font-semibold text-[#1b2b40]">{b.users?.full_name || "—"}</td>
                    <td className="border-b border-[#dde4ec] px-2.5 py-2.5">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-[0.65rem] font-bold ${b.request_type === "faculty" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>
                        {b.request_type}
                      </span>
                    </td>
                    <td className="border-b border-[#dde4ec] px-2.5 py-2.5">
                      <span className={`inline-flex items-center gap-1 rounded-[10px] px-2.5 py-0.5 text-[0.68rem] font-bold ${
                        b.status === "borrowed" ? "bg-[#eff6ff] text-[#1d4ed8]" :
                        b.status === "returned" ? "bg-[#ecfdf5] text-[#065f46]" :
                        b.status === "pending" ? "bg-[#fffbeb] text-[#92400e]" :
                        b.status === "approved" ? "bg-blue-50 text-blue-700" :
                        "bg-red-50 text-red-700"
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${
                          b.status === "borrowed" ? "bg-[#1d4ed8]" : b.status === "returned" ? "bg-[#065f46]" : b.status === "pending" ? "bg-[#92400e]" : "bg-blue-500"
                        }`} />
                        {b.status}
                      </span>
                    </td>
                    <td className="border-b border-[#dde4ec] px-2.5 py-2.5 text-[0.8rem] text-[#4a5e74]">{new Date(b.created_at).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="overflow-hidden rounded-xl border border-[#dde4ec] bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-[#dde4ec] px-5 py-3.5" style={{ background: "linear-gradient(135deg, #1b2b40 0%, #253348 100%)" }}>
          <h5 className="m-0 flex items-center gap-2 text-[0.85rem] font-bold text-white/90">
            <Clock className="h-3.5 w-3.5" /> Recent Activity
          </h5>
          <Link href="/admin/activity-logs" className="rounded-xl bg-white/[0.15] px-2.5 py-[3px] text-[0.68rem] font-bold text-white/85 no-underline">View All</Link>
        </div>
        <div className="overflow-x-auto p-0">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#f2f5f9] text-left">
                {["User", "Action", "Entity", "Time"].map((h) => (
                  <th key={h} className="px-2.5 py-2 text-[0.68rem] font-semibold uppercase tracking-wider text-[#8fa1b3]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentActivity.length === 0 ? (
                <tr><td colSpan={4} className="py-8 text-center text-[0.82rem] text-[#8fa1b3]">No recent activity</td></tr>
              ) : (
                recentActivity.map((log: RecentActivity) => (
                  <tr key={log.id} className="hover:bg-[#f8fafb]">
                    <td className="border-b border-[#dde4ec] px-2.5 py-2.5 text-[0.8rem] text-[#1b2b40]">{log.users?.full_name || "—"}</td>
                    <td className="border-b border-[#dde4ec] px-2.5 py-2.5">
                      <span className={`rounded px-2 py-0.5 text-[0.65rem] font-bold ${
                        log.action === "create" ? "bg-green-100 text-green-700" :
                        log.action === "update" ? "bg-blue-100 text-blue-700" :
                        log.action === "delete" ? "bg-red-100 text-red-700" :
                        "bg-gray-100 text-gray-600"
                      }`}>{log.action}</span>
                    </td>
                    <td className="border-b border-[#dde4ec] px-2.5 py-2.5 text-[0.8rem] text-[#4a5e74]">{log.entity_type || "—"}</td>
                    <td className="border-b border-[#dde4ec] px-2.5 py-2.5 text-[0.8rem] text-[#8fa1b3]">{new Date(log.created_at).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
