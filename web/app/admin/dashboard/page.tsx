"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Microscope, PackageCheck, Clock, AlertTriangle } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";

interface StatCard {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<StatCard[]>([
    { label: "Total Equipment", value: 0, icon: Microscope, color: "#3b82f6" },
    { label: "Available", value: 0, icon: PackageCheck, color: "#10b981" },
    { label: "In Use", value: 0, icon: Clock, color: "#f59e0b" },
    { label: "Under Maintenance", value: 0, icon: AlertTriangle, color: "#ef4444" },
  ]);
  const [equipmentByCategory, setEquipmentByCategory] = useState<{ name: string; count: number }[]>([]);
  const [equipmentByStatus, setEquipmentByStatus] = useState<{ name: string; value: number }[]>([]);
  const [recentBorrows, setRecentBorrows] = useState<{ id: string; user: string; items: string; date: string; status: string }[]>([]);

  const COLORS = ["#0ea5a0", "#3b82f6", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6"];

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();

      const { count: total } = await supabase.from("equipment").select("*", { count: "exact", head: true });
      const { count: available } = await supabase.from("equipment").select("*", { count: "exact", head: true }).eq("status", "available");
      const { count: borrowed } = await supabase.from("equipment").select("*", { count: "exact", head: true }).eq("status", "borrowed");
      const { count: maintenance } = await supabase.from("equipment").select("*", { count: "exact", head: true }).eq("status", "under_maintenance");

      setStats([
        { label: "Total Equipment", value: total || 0, icon: Microscope, color: "#3b82f6" },
        { label: "Available", value: available || 0, icon: PackageCheck, color: "#10b981" },
        { label: "In Use", value: borrowed || 0, icon: Clock, color: "#f59e0b" },
        { label: "Under Maintenance", value: maintenance || 0, icon: AlertTriangle, color: "#ef4444" },
      ]);

      const { data: cats } = await supabase.from("categories").select("id, name");
      if (cats) {
        const catData = await Promise.all(
          cats.map(async (cat) => {
            const { count } = await supabase.from("equipment").select("*", { count: "exact", head: true }).eq("category_id", cat.id);
            return { name: cat.name, count: count || 0 };
          }),
        );
        setEquipmentByCategory(catData.filter((c) => c.count > 0));
      }

      setEquipmentByStatus([
        { name: "Available", value: available || 0 },
        { name: "Borrowed", value: borrowed || 0 },
        { name: "Maintenance", value: maintenance || 0 },
      ]);

      const { data: borrows } = await supabase
        .from("borrow_requests")
        .select("id, user_id, status, created_at")
        .order("created_at", { ascending: false })
        .limit(5);

      if (borrows) {
        const withUsers = await Promise.all(
          borrows.map(async (b) => {
            const { data: user } = await supabase.from("users").select("full_name").eq("id", b.user_id).single();
            return {
              id: b.id.slice(0, 8),
              user: user?.full_name || "Unknown",
              items: "-",
              date: new Date(b.created_at).toLocaleDateString(),
              status: b.status,
            };
          }),
        );
        setRecentBorrows(withUsers);
      }
    };

    fetchData();
  }, []);

  return (
    <div>
      <div className="mb-6 rounded-xl border border-[#dde4ec] bg-white p-4 shadow-sm">
        <h2 className="flex items-center gap-2 text-lg font-bold text-navy">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-light text-teal">
            <LayoutDashboardIcon />
          </span>
          Dashboard Overview
        </h2>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="ecp-stat-card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-silver">{stat.label}</p>
                <p className="mt-1 text-3xl font-bold text-navy">{stat.value}</p>
              </div>
              <div
                className="flex h-10 w-10 items-center justify-center rounded-lg"
                style={{ backgroundColor: stat.color + "15" }}
              >
                <stat.icon className="h-5 w-5" style={{ color: stat.color }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="ecp-card p-5">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-silver">
            Equipment by Category
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={equipmentByCategory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#dde4ec" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#8fa1b3" }} />
              <YAxis tick={{ fontSize: 11, fill: "#8fa1b3" }} />
              <Tooltip />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {equipmentByCategory.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="ecp-card p-5">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-silver">
            Equipment by Status
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={equipmentByStatus} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                {equipmentByStatus.map((_, i) => (
                  <Cell key={i} fill={COLORS[i]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="ecp-card p-5">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-silver">
          Recent Borrowings
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#dde4ec] bg-[#f8f9fa] text-xs font-semibold uppercase tracking-wider text-silver">
                <th className="px-4 py-3">Request ID</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentBorrows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-silver">
                    No borrow requests yet
                  </td>
                </tr>
              ) : (
                recentBorrows.map((b) => (
                  <tr key={b.id} className="border-b border-[#f0f0f0] hover:bg-[#f8f9fa]">
                    <td className="px-4 py-3 font-mono text-xs">#{b.id}</td>
                    <td className="px-4 py-3">{b.user}</td>
                    <td className="px-4 py-3">{b.date}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase ${
                          b.status === "borrowed"
                            ? "bg-blue-100 text-blue-700"
                            : b.status === "returned"
                              ? "bg-green-100 text-green-700"
                              : b.status === "pending"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-zinc-100 text-zinc-700"
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
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

function LayoutDashboardIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="7" height="9" x="3" y="3" rx="1" />
      <rect width="7" height="5" x="14" y="3" rx="1" />
      <rect width="7" height="9" x="14" y="12" rx="1" />
      <rect width="7" height="5" x="3" y="16" rx="1" />
    </svg>
  );
}
