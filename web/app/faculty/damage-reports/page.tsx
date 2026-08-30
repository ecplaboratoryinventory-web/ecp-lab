"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertTriangle,
  Eye,
  Search,
  ChevronLeft,
} from "lucide-react";
import Link from "next/link";

interface DamageReport {
  id: string;
  user_id: string;
  equipment_id: string;
  borrow_request_id: string | null;
  description: string;
  severity: "minor" | "major" | "critical";
  damage_type: string | null;
  status: "pending" | "resolved" | "partial" | "dismissed";
  replaced_quantity: number;
  resolved_by: string | null;
  created_at: string;
  users?: { full_name: string } | null;
  equipment?: {
    name: string;
    department: string | null;
    category_id: string | null;
    categories?: { name: string } | null;
  } | null;
  resolved?: { full_name: string } | null;
  borrow_request?: {
    borrow_items?: { equipment_id: string; quantity: number }[] | null;
  } | null;
}

type StatusFilter = "all" | "pending" | "replaced" | "partial";
type Status = "pending" | "resolved" | "partial" | "dismissed";

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "replaced", label: "Replaced" },
  { value: "partial", label: "Partial" },
];

const CATEGORY_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All" },
  { value: "electronics", label: "Electronics" },
  { value: "chemistry", label: "Chemistry" },
  { value: "physics", label: "Physics" },
];

const STATUS_BADGE: Record<Status, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-amber-100 text-amber-700" },
  resolved: { label: "Replaced", className: "bg-green-100 text-green-700" },
  partial: { label: "Partial", className: "bg-orange-100 text-orange-700" },
  dismissed: { label: "Dismissed", className: "bg-gray-100 text-gray-500" },
};

const STATUS_DOT: Record<Status, string> = {
  pending: "bg-amber-500",
  resolved: "bg-green-500",
  partial: "bg-orange-500",
  dismissed: "bg-gray-400",
};

const SEVERITY_LABEL: Record<string, string> = {
  minor: "Minor",
  major: "Major",
  critical: "Critical",
};

const DAMAGE_TYPE_LABEL: Record<string, string> = {
  minor_damage: "Minor Damage",
  major_damage: "Major Damage",
  missing_parts: "Missing Parts",
  lost: "Lost",
};

function FilterPills({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`rounded-md border px-4 py-1.5 text-xs font-semibold transition-all ${
            value === o.value
              ? "border-[#0ea5a0] bg-[#e0f7f6] text-[#0ea5a0]"
              : "border-[#dde4ec] bg-white text-silver hover:border-[#0ea5a0] hover:text-[#0ea5a0]"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export default function FacultyDamageReportsPage() {
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(true);
  const [userDept, setUserDept] = useState("");
  const [reports, setReports] = useState<DamageReport[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [stats, setStats] = useState({ total: 0, pending: 0, replaced: 0, partial: 0 });

  const [viewOpen, setViewOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<DamageReport | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);

    const { data: authData } = await supabase.auth.getUser();
    const userId = authData.user?.id;

    const { data: profile } = await supabase
      .from("users")
      .select("department")
      .eq("id", userId || "")
      .single();
    const dept = profile?.department || "";
    setUserDept(dept);

    const { data } = await supabase
      .from("damage_reports")
      .select(
        `*,
        users:user_id(full_name),
        equipment:equipment_id(name, department, category_id, categories:category_id(name)),
        resolved:resolved_by(full_name),
        borrow_request:borrow_request_id(borrow_items(equipment_id, quantity))`
      )
      .order("created_at", { ascending: false });

    const deptReports = ((data as DamageReport[]) || []).filter(
      (r) => r.equipment?.department === dept
    );
    setReports(deptReports);
    setStats({
      total: deptReports.length,
      pending: deptReports.filter((r) => r.status === "pending").length,
      replaced: deptReports.filter((r) => r.status === "resolved").length,
      partial: deptReports.filter((r) => r.status === "partial").length,
    });

    setLoading(false);
    setChecking(false);
  }, []);

  useEffect(() => {
    void (async () => {
      await fetchData();
    })();
  }, [fetchData]);

  const getCategory = (r: DamageReport) => r.equipment?.categories?.name || "-";
  const getQty = (r: DamageReport) =>
    r.borrow_request?.borrow_items?.find((bi) => bi.equipment_id === r.equipment_id)
      ?.quantity || 1;
  const getAssessedBy = (r: DamageReport) => r.resolved?.full_name || "—";

  const showCategoryFilter = userDept === "Science";

  const filtered = reports.filter((r) => {
    if (statusFilter === "pending" && r.status !== "pending") return false;
    if (statusFilter === "replaced" && r.status !== "resolved") return false;
    if (statusFilter === "partial" && r.status !== "partial") return false;
    if (showCategoryFilter && categoryFilter !== "all") {
      const cat = (r.equipment?.categories?.name || "").toLowerCase();
      if (cat !== categoryFilter) return false;
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const name = (r.users?.full_name || "").toLowerCase();
      const eq = (r.equipment?.name || "").toLowerCase();
      if (!name.includes(q) && !eq.includes(q)) return false;
    }
    return true;
  });

  const openView = (report: DamageReport) => {
    setSelectedReport(report);
    setViewOpen(true);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f2f5f9]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      <div>
        <div className="mb-6 rounded-xl border border-[#dde4ec] bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-xl font-bold text-navy">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-500">
                <AlertTriangle className="h-4 w-4" />
              </span>
              Damage Reports
            </h2>
            <Link href="/faculty/dashboard">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 border-[#dde4ec] text-silver"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Back
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Total Reports", value: stats.total, color: "#6b7280" },
            { label: "Pending", value: stats.pending, color: "#f59e0b" },
            { label: "Partial", value: stats.partial, color: "#f97316" },
            { label: "Replaced", value: stats.replaced, color: "#10b981" },
          ].map((s) => (
            <div
              key={s.label}
              className="flex flex-col items-center rounded-lg border border-[#dde4ec] bg-[#f8f9fa] px-4 py-6 text-center"
            >
              <span className="text-[0.7rem] font-bold uppercase tracking-wider text-silver">
                {s.label}
              </span>
              <span className="mt-2 text-3xl font-bold text-navy">{s.value}</span>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          {/* Status */}
          <div>
            <p className="mb-1.5 text-xs font-bold text-navy">Status</p>
            <FilterPills
              options={STATUS_FILTERS}
              value={statusFilter}
              onChange={(v) => setStatusFilter(v as StatusFilter)}
            />
          </div>

          {/* Category — only for Science Faculty */}
          {showCategoryFilter && (
            <div>
              <p className="mb-1.5 text-xs font-bold text-navy">Category</p>
              <FilterPills
                options={CATEGORY_OPTIONS}
                value={categoryFilter}
                onChange={setCategoryFilter}
              />
            </div>
          )}

          {/* Search */}
          <div>
            <p className="mb-1.5 text-xs font-bold text-navy">Search</p>
            <div className="relative max-w-xl">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-silver" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search borrower or damaged equipment..."
                className="w-full rounded-md border border-[#dde4ec] bg-white py-2 pl-9 pr-3 text-sm text-navy outline-none placeholder:text-silver focus:border-[#0ea5a0]"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="mt-6 overflow-hidden rounded-lg border border-[#dde4ec] bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#dde4ec] bg-[#f8f9fa] text-xs font-semibold uppercase tracking-wider text-navy">
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Borrower</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Damaged Equipment</th>
                  <th className="px-4 py-3 text-center">Qty.</th>
                  <th className="px-4 py-3">Assessed By</th>
                  <th className="px-4 py-3">Status / Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="border-b border-[#f0f0f0]">
                      <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-28" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-12" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-32" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-6" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-5 w-24" /></td>
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-16 text-center">
                      <AlertTriangle className="mx-auto mb-3 h-10 w-10 text-silver/40" />
                      <p className="text-sm font-medium text-silver">No damage reports found</p>
                      <p className="mt-1 text-xs text-silver/60">
                        {statusFilter !== "all" || (showCategoryFilter && categoryFilter !== "all") || search
                          ? "No reports match the selected filter."
                          : "Everything looks good!"}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((r) => {
                    const cfg = STATUS_BADGE[r.status] || STATUS_BADGE.pending;
                    return (
                      <tr key={r.id} className="border-b border-[#f0f0f0] hover:bg-[#f8f9fa]">
                        <td className="px-4 py-3 whitespace-nowrap text-silver">
                          {formatDate(r.created_at)}
                        </td>
                        <td className="px-4 py-3 font-medium text-navy">
                          {r.users?.full_name || "Unknown"}
                        </td>
                        <td className="px-4 py-3 text-silver">{getCategory(r)}</td>
                        <td className="px-4 py-3 text-silver">{r.equipment?.name || "-"}</td>
                        <td className="px-4 py-3 text-center font-medium text-navy">
                          {getQty(r)}
                        </td>
                        <td className="px-4 py-3 text-silver">{getAssessedBy(r)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase ${cfg.className}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[r.status] || "bg-silver"}`} />
                              {cfg.label}
                            </span>
                            <button
                              onClick={() => openView(r)}
                              className="flex items-center gap-1 text-[0.78rem] font-semibold text-[#0ea5a0] underline hover:text-teal-dark"
                            >
                              <Eye className="h-3 w-3" /> View
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* View Modal */}
        <Dialog open={viewOpen} onOpenChange={setViewOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-navy">
                Damage Report
              </DialogTitle>
            </DialogHeader>

            {selectedReport && (
              <div className="space-y-6">
                <div>
                  <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-navy">
                    Borrower Information
                  </h4>
                  <div className="overflow-hidden rounded-md border border-[#dde4ec]">
                    <table className="w-full text-sm">
                      <tbody>
                        {[
                          { k: "Borrower", v: selectedReport.users?.full_name || "Unknown" },
                          { k: "Date Reported", v: formatDate(selectedReport.created_at) },
                          { k: "Category", v: getCategory(selectedReport) },
                          { k: "Assessed By", v: getAssessedBy(selectedReport) },
                        ].map((row) => (
                          <tr key={row.k} className="border-b border-[#f0f0f0] last:border-0">
                            <td className="w-40 bg-[#f8f9fa] px-3 py-2 font-semibold text-navy">
                              {row.k}
                            </td>
                            <td className="px-3 py-2 text-navy">{row.v}</td>
                          </tr>
                        ))}
                        <tr className="border-b border-[#f0f0f0] last:border-0">
                          <td className="w-40 bg-[#f8f9fa] px-3 py-2 font-semibold text-navy">Status</td>
                          <td className="px-3 py-2">
                            <span className={`inline-flex items-center gap-1.5 text-sm font-semibold uppercase ${
                              STATUS_BADGE[selectedReport.status]?.className || "text-silver"
                            }`}>
                              <span className={`h-2 w-2 rounded-full ${STATUS_DOT[selectedReport.status] || "bg-silver"}`} />
                              {STATUS_BADGE[selectedReport.status]?.label || selectedReport.status}
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-navy">
                    Damaged Equipment
                  </h4>
                  <div className="overflow-hidden rounded-md border border-[#dde4ec]">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-[#eef1f4] text-xs font-semibold uppercase tracking-wider text-navy">
                          <th className="px-3 py-2">Equipment</th>
                          <th className="px-3 py-2 text-center">Damaged Qty.</th>
                          <th className="px-3 py-2">Damage Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-[#f0f0f0] last:border-0">
                          <td className="px-3 py-2 font-medium text-navy">
                            {selectedReport.equipment?.name || "-"}
                          </td>
                          <td className="px-3 py-2 text-center text-navy">{getQty(selectedReport)}</td>
                          <td className="px-3 py-2 text-silver">
                            {DAMAGE_TYPE_LABEL[selectedReport.damage_type || ""] ? (
                              <span className="mr-1.5 rounded bg-amber-50 px-1.5 py-0.5 text-[11px] font-semibold text-amber-700">
                                {DAMAGE_TYPE_LABEL[selectedReport.damage_type || ""]}
                              </span>
                            ) : (
                              SEVERITY_LABEL[selectedReport.severity] && (
                                <span className="mr-1.5 rounded bg-amber-50 px-1.5 py-0.5 text-[11px] font-semibold text-amber-700">
                                  {SEVERITY_LABEL[selectedReport.severity]}
                                </span>
                              )
                            )}
                            {selectedReport.description || "—"}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button variant="outline" onClick={() => setViewOpen(false)} className="border-[#dde4ec]">
                    Close
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
