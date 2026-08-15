"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  Microscope,
  PackageCheck,
  Clock,
  Monitor,
} from "lucide-react";

interface Equipment {
  id: string;
  name: string;
  serial_number: string;
  category_id: string;
  quantity: number;
  available_quantity: number;
  status: string;
  description: string;
  brand: string;
  model: string;
  location: string;
  condition: string;
  categories?: { name: string };
}

interface Category {
  id: string;
  name: string;
}

const STATUS_VARIANTS: Record<string, { label: string; className: string }> = {
  available: { label: "Available", className: "bg-green-100 text-green-700" },
  borrowed: { label: "In Use", className: "bg-blue-100 text-blue-700" },
  under_maintenance: {
    label: "Maintenance",
    className: "bg-amber-100 text-amber-700",
  },
};

export default function FacultyEquipmentPage() {
  const supabase = createClient();

  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stats, setStats] = useState({ total: 0, available: 0, inUse: 0 });
  const [userDept, setUserDept] = useState<string | null>(null);

  useEffect(() => {
    const fetchDepartment = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from("users")
        .select("department")
        .eq("id", user.id)
        .single();
      if (profile?.department) {
        setUserDept(profile.department);
      }
    };
    fetchDepartment();
  }, []);

  const fetchEquipment = useCallback(async () => {
    setLoading(true);

    let query = supabase
      .from("equipment")
      .select("*, categories(name)")
      .order("name");

    if (userDept) {
      query = query.eq("department", userDept);
    }
    if (categoryFilter !== "all") {
      query = query.eq("category_id", categoryFilter);
    }
    if (search) {
      query = query.or(
        `name.ilike.%${search}%,serial_number.ilike.%${search}%`,
      );
    }

    const { data } = await query;
    setEquipment((data as Equipment[]) || []);
    setLoading(false);
  }, [categoryFilter, search, userDept]);

  const fetchCategories = useCallback(async () => {
    const { data } = await supabase
      .from("categories")
      .select("*")
      .order("name");
    if (data) setCategories(data as Category[]);
  }, []);

  const fetchStats = useCallback(async () => {
    const buildQuery = () =>
      userDept
        ? supabase.from("equipment").select("*", { count: "exact", head: true }).eq("department", userDept)
        : supabase.from("equipment").select("*", { count: "exact", head: true });

    const [
      { count: total },
      { count: available },
      { count: borrowed },
    ] = await Promise.all([
      buildQuery(),
      buildQuery().eq("status", "available"),
      buildQuery().eq("status", "borrowed"),
    ]);

    setStats({
      total: total || 0,
      available: available || 0,
      inUse: borrowed || 0,
    });
  }, [userDept]);

  useEffect(() => {
    void (async () => {
      await fetchCategories();
    })();
  }, [fetchCategories]);

  useEffect(() => {
    void (async () => {
      await fetchEquipment();
    })();
  }, [fetchEquipment]);

  useEffect(() => {
    void (async () => {
      await fetchStats();
    })();
  }, [fetchStats]);

  const getStatusBadge = (status: string) => {
    const config = STATUS_VARIANTS[status] || STATUS_VARIANTS.available;
    return (
      <span
        className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase ${config.className}`}
      >
        {config.label}
      </span>
    );
  };

  return (
    <div>
      <div className="mb-6 rounded-xl border border-[#dde4ec] bg-gradient-to-r from-navy to-[#253348] p-6 shadow-sm">
        <h2 className="flex items-center gap-2 text-xl font-bold text-white">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal/20 text-teal">
            <Microscope className="h-4 w-4" />
          </span>
          Equipment Catalog
        </h2>
        <p className="mt-1 text-sm text-white/70">
          Browse available laboratory equipment
        </p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          {
            label: "Total Equipment",
            value: stats.total,
            icon: Microscope,
            color: "#3b82f6",
          },
          {
            label: "Available",
            value: stats.available,
            icon: PackageCheck,
            color: "#10b981",
          },
          {
            label: "In Use",
            value: stats.inUse,
            icon: Clock,
            color: "#f59e0b",
          },
        ].map((s) => (
          <div key={s.label} className="ecp-stat-card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-silver">{s.label}</p>
                <p className="mt-1 text-3xl font-bold text-navy">{s.value}</p>
              </div>
              <div
                className="flex h-10 w-10 items-center justify-center rounded-lg"
                style={{ backgroundColor: s.color + "15" }}
              >
                <s.icon className="h-5 w-5" style={{ color: s.color }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={() => setCategoryFilter("all")}
          className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
            categoryFilter === "all"
              ? "border-teal bg-teal text-white"
              : "border-[#dde4ec] bg-white text-silver hover:border-teal hover:text-teal"
          }`}
        >
          All Categories
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setCategoryFilter(c.id)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
              categoryFilter === c.id
                ? "border-teal bg-teal text-white"
                : "border-[#dde4ec] bg-white text-silver hover:border-teal hover:text-teal"
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-silver" />
        <Input
          placeholder="Search by name or serial number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md border-[#dde4ec] pl-10"
        />
      </div>

      <div className="ecp-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#dde4ec] bg-[#f8f9fa] text-xs font-semibold uppercase tracking-wider text-silver">
                <th className="px-4 py-3">Equipment</th>
                <th className="px-4 py-3">Serial #</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3 text-center">Available</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-[#f0f0f0]">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <Skeleton className="h-4 w-full rounded bg-[#f0f0f0]" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : equipment.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center">
                    <Monitor className="mx-auto mb-3 h-10 w-10 text-silver/40" />
                    <p className="text-sm font-medium text-silver">
                      No equipment found
                    </p>
                    <p className="mt-1 text-xs text-silver/60">
                      {search || categoryFilter !== "all"
                        ? "Try adjusting your filters"
                        : "No equipment has been added to the catalog yet"}
                    </p>
                  </td>
                </tr>
              ) : (
                equipment.map((eq) => (
                  <tr
                    key={eq.id}
                    className="border-b border-[#f0f0f0] hover:bg-[#f8f9fa]"
                  >
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-navy">{eq.name}</p>
                        {eq.brand && (
                          <p className="text-xs text-silver">{eq.brand}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-silver">
                      {eq.serial_number || "-"}
                    </td>
                    <td className="px-4 py-3 text-silver">
                      {eq.categories?.name || "-"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-semibold text-navy">
                        {eq.available_quantity}
                      </span>
                      <span className="text-silver"> / {eq.quantity}</span>
                    </td>
                    <td className="px-4 py-3 text-silver">
                      {eq.location || "-"}
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(eq.status)}
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
