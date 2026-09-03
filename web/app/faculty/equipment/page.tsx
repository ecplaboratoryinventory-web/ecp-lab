"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import {
  Search,
  Microscope,
  PackageCheck,
  Clock,
  Monitor,
  PackagePlus,
  Check,
  X,
} from "lucide-react";

const DEPT_CATEGORY_FILTER: Record<string, string[]> = {
  Engineering: ["Electronics"],
  Science: ["Chemistry", "Physics"],
};

interface Equipment {
  id: string;
  name: string;
  serial_number: string;
  category_id: string;
  subcategory_id: string | null;
  quantity: number;
  available_quantity: number;
  status: string;
  description: string;
  brand: string;
  model: string;
  location: string;
  condition: string;
  image_url: string | null;
  categories?: { name: string };
  subcategories?: { name: string };
}

interface Category {
  id: string;
  name: string;
}

interface Subcategory {
  id: string;
  category_id: string;
  name: string;
}

const ICON_MAP: Record<string, string> = {
  Microcontrollers: "🔌",
  "Single Board PCs": "🖥️",
  "Desktop PCs": "💻",
  Components: "⚡",
  Glassware: "🧪",
  "Measuring Instruments": "📏",
  "Chemicals and Reagents": "⚗️",
  "Safety Equipment": "🛡️",
  Consumables: "📄",
  "Electrical Equipment": "🔋",
  "Optical Equipment": "🔬",
  "Mechanics Equipment": "⚙️",
};

export default function FacultyEquipmentPage() {
  const router = useRouter();
  const supabase = createClient();

  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [subcategoryFilter, setSubcategoryFilter] = useState("all");
  const [stats, setStats] = useState({ total: 0, available: 0, reservations: 0 });
  const [userDept, setUserDept] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

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
  }, [supabase]);

  const fetchEquipment = useCallback(async () => {
    setLoading(true);

    let query = supabase
      .from("equipment")
      .select("*, categories(name), subcategories(name)")
      .order("name");

    if (userDept) {
      query = query.eq("department", userDept);
    }
    if (categoryFilter !== "all") {
      query = query.eq("category_id", categoryFilter);
    }
    if (subcategoryFilter !== "all") {
      query = query.eq("subcategory_id", subcategoryFilter);
    }
    if (search) {
      query = query.or(
        `name.ilike.%${search}%,serial_number.ilike.%${search}%`,
      );
    }

    const { data } = await query;
    setEquipment((data as Equipment[]) || []);
    setLoading(false);
  }, [supabase, categoryFilter, subcategoryFilter, search, userDept]);

  const fetchCategories = useCallback(async () => {
    const { data } = await supabase
      .from("categories")
      .select("*")
      .order("name");
    if (data) setCategories(data as Category[]);
    const { data: subs } = await supabase
      .from("subcategories")
      .select("*")
      .order("name");
    if (subs) setSubcategories(subs as Subcategory[]);
  }, [supabase]);

  const fetchStats = useCallback(async () => {
    const buildQuery = () =>
      userDept
        ? supabase.from("equipment").select("*", { count: "exact", head: true }).eq("department", userDept)
        : supabase.from("equipment").select("*", { count: "exact", head: true });

    const [
      { count: total },
      { count: available },
    ] = await Promise.all([
      buildQuery(),
      buildQuery().eq("status", "available"),
    ]);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    let reservations = 0;
    if (user) {
      const { count } = await supabase
        .from("borrow_requests")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .in("status", ["approved", "borrowed"]);
      reservations = count || 0;
    }

    setStats({ total: total || 0, available: available || 0, reservations });
  }, [supabase, userDept]);

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

  const allowedDeptCategories: string[] | null = userDept
    ? DEPT_CATEGORY_FILTER[userDept] ?? null
    : null;
  const visibleCategories =
    allowedDeptCategories === null
      ? categories
      : categories.filter((c) => allowedDeptCategories.includes(c.name));
  const visibleCategoryIds = new Set(visibleCategories.map((c) => c.id));
  const visibleSubcategories =
    categoryFilter === "all"
      ? subcategories.filter((s) => visibleCategoryIds.has(s.category_id))
      : subcategories.filter((s) => s.category_id === categoryFilter);

  // Only show the category/subcategory filter chips when the faculty member's
  // department maps to more than one category (e.g. Science -> Chemistry,
  // Physics). Departments with a single category (e.g. Engineering ->
  // Electronics) don't need the filter UI.
  const showCategoryFilters = visibleCategories.length > 1;

  const toggleSelect = (eq: Equipment) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(eq.id)) {
        next.delete(eq.id);
      } else {
        next.add(eq.id);
      }
      return next;
    });
  };

  const handleBorrow = () => {
    if (selectedIds.size === 0) return;
    router.push(`/faculty/borrow-request?eq=${Array.from(selectedIds).join(",")}`);
  };

  return (
    <div>
      <div className="mb-6 rounded-xl border border-[#dde4ec] bg-gradient-to-r from-navy to-[#253348] p-6 shadow-sm">
        <h2 className="flex items-center gap-2 text-xl font-bold text-white">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal/20 text-teal">
            <Microscope className="h-4 w-4" />
          </span>
          Equipment
        </h2>
        <p className="mt-1 text-sm text-white/70">
          Browse and borrow available laboratory equipment
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
            label: "Reservations",
            value: stats.reservations,
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

      {showCategoryFilters && (
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            onClick={() => {
              setCategoryFilter("all");
              setSubcategoryFilter("all");
            }}
            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
              categoryFilter === "all"
                ? "border-teal bg-teal text-white"
                : "border-[#dde4ec] bg-white text-silver hover:border-teal hover:text-teal"
            }`}
          >
            All Categories
          </button>
          {visibleCategories.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                setCategoryFilter(c.id);
                setSubcategoryFilter("all");
              }}
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
      )}

      {showCategoryFilters && visibleSubcategories.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            onClick={() => setSubcategoryFilter("all")}
            className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-all ${
              subcategoryFilter === "all"
                ? "border-teal bg-teal-light text-teal"
                : "border-[#dde4ec] bg-white text-silver hover:border-teal hover:text-teal"
            }`}
          >
            All Subcategories
          </button>
          {visibleSubcategories.map((s) => (
            <button
              key={s.id}
              onClick={() => setSubcategoryFilter(s.id)}
              className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-all ${
                subcategoryFilter === s.id
                  ? "border-teal bg-teal-light text-teal"
                  : "border-[#dde4ec] bg-white text-silver hover:border-teal hover:text-teal"
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
      )}

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-silver" />
        <Input
          placeholder="Search equipment..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md border-[#dde4ec] pl-10"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="ecp-card h-44 animate-pulse p-4">
              <div className="mb-2 h-4 w-3/4 rounded bg-[#f0f0f0]" />
              <div className="mb-2 h-3 w-1/2 rounded bg-[#f0f0f0]" />
              <div className="h-5 w-20 rounded-full bg-[#f0f0f0]" />
            </div>
          ))}
        </div>
      ) : equipment.length === 0 ? (
        <div className="ecp-card flex flex-col items-center justify-center py-12">
          <Monitor className="mb-3 h-10 w-10 text-silver" />
          <p className="text-sm text-silver">No equipment found</p>
          <p className="mt-1 text-xs text-silver/60">
            {search || categoryFilter !== "all" || subcategoryFilter !== "all"
              ? "Try adjusting your filters"
              : "No equipment available for your department"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {equipment.map((eq) => {
            const catName = eq.subcategories?.name || "";
            const icon = ICON_MAP[catName] || "📦";
            const isSelected = selectedIds.has(eq.id);
            const unavailable = eq.available_quantity < 1;

            return (
              <button
                key={eq.id}
                onClick={() => toggleSelect(eq)}
                disabled={unavailable}
                className={`group w-full overflow-hidden rounded-2xl border bg-white text-left shadow-sm transition-all hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 ${
                  isSelected ? "ring-2 ring-teal" : "border-[#dde4ec]"
                }`}
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#eef2f6]">
                  {eq.image_url ? (
                    <Image src={eq.image_url} alt={eq.name} fill unoptimized className="object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#0ea5a0] to-[#0b857f]">
                      <span className="text-6xl drop-shadow">{icon}</span>
                    </div>
                  )}
                  {isSelected && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-teal shadow-lg">
                        <Check className="h-6 w-6 text-white" />
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-3 p-4">
                  <h3 className="truncate text-sm font-bold text-navy">{eq.name}</h3>
                  <div className="flex gap-1.5">
                    <span className="rounded border border-[#E2E8F0] px-2 py-0.5 text-[10px] font-semibold uppercase text-slate">
                      {catName || "Equipment"}
                    </span>
                    {eq.brand && (
                      <span className="rounded border border-[#E2E8F0] px-2 py-0.5 text-[10px] font-semibold uppercase text-slate">
                        {eq.brand}
                      </span>
                    )}
                  </div>
                  <p className="text-xs leading-relaxed text-slate line-clamp-2">
                    {eq.description || "Laboratory equipment for academic and research use."}
                  </p>
                  <hr className="border-[#f0f0f0]" />
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="block text-[10px] font-bold uppercase text-silver">Available</span>
                      <span className="text-lg font-bold text-navy">{eq.available_quantity} units</span>
                    </div>
                    <span
                      className={`rounded-xl px-4 py-2 text-[11px] font-semibold transition-colors ${
                        isSelected
                          ? "bg-teal text-white"
                          : "bg-teal-light text-teal group-hover:bg-teal group-hover:text-white"
                      }`}
                    >
                      {isSelected ? "Selected" : "Select"}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {selectedIds.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-10 border-t border-[#dde4ec] bg-white p-4 shadow-lg">
          <div className="mx-auto flex max-w-5xl items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-navy">
                {selectedIds.size} item{selectedIds.size !== 1 ? "s" : ""} selected
              </span>
              <button
                onClick={() => setSelectedIds(new Set())}
                className="flex items-center gap-1 text-xs font-medium text-red-500 hover:text-red-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <button
              onClick={handleBorrow}
              className="inline-flex items-center gap-1.5 rounded-lg bg-teal px-5 py-2 text-sm font-semibold text-white hover:bg-teal-dark"
            >
              <PackagePlus className="h-4 w-4" />
              Borrow
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
