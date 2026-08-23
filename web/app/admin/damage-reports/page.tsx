"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertTriangle,
  Eye,
  CheckCircle,
  XCircle,
  Wrench,
  ChevronLeft,
} from "lucide-react";
import Link from "next/link";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { createNotification, notifyRole } from "@/lib/notifications";

interface DamageReport {
  id: string;
  user_id: string;
  equipment_id: string;
  borrow_request_id: string | null;
  description: string;
  severity: "minor" | "major" | "critical";
  status: "pending" | "resolved" | "dismissed";
  resolution_notes: string | null;
  resolved_by: string | null;
  image_urls: string[] | null;
  created_at: string;
  users?: { full_name: string } | null;
  equipment?: { name: string } | null;
}

type StatusFilter = "all" | "pending" | "resolved" | "dismissed";

const SEVERITY_CONFIG: Record<string, { label: string; className: string }> = {
  minor: { label: "Minor", className: "bg-amber-100 text-amber-700" },
  major: { label: "Major", className: "bg-orange-100 text-orange-700" },
  critical: { label: "Critical", className: "bg-red-100 text-red-700" },
};

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-amber-100 text-amber-700" },
  resolved: { label: "Resolved", className: "bg-green-100 text-green-700" },
  dismissed: { label: "Dismissed", className: "bg-gray-100 text-gray-600" },
};

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "resolved", label: "Resolved" },
  { value: "dismissed", label: "Dismissed" },
];

export default function DamageReportsPage() {
  const supabase = createClient();

  const [reports, setReports] = useState<DamageReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [stats, setStats] = useState({ total: 0, pending: 0, resolved: 0 });

  const [viewOpen, setViewOpen] = useState(false);
  const [resolveOpen, setResolveOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<DamageReport | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);

  const withConfirm = (action: () => void) => {
    setConfirmAction(() => action);
    setConfirmOpen(true);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);

    let query = supabase
      .from("damage_reports")
      .select("*, users(full_name), equipment(name)")
      .order("created_at", { ascending: false });

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    const { data } = await query;
    if (data) {
      setReports(data as DamageReport[]);
    } else {
      setReports([]);
    }

    const { count: total } = await supabase
      .from("damage_reports")
      .select("*", { count: "exact", head: true });

    const { count: pending } = await supabase
      .from("damage_reports")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");

    const { count: resolved } = await supabase
      .from("damage_reports")
      .select("*", { count: "exact", head: true })
      .eq("status", "resolved");

    setStats({
      total: total || 0,
      pending: pending || 0,
      resolved: resolved || 0,
    });

    setLoading(false);
  }, [statusFilter]);

  useEffect(() => {
    void (async () => {
      await fetchData();
    })();
  }, [fetchData]);

  const openView = (report: DamageReport) => {
    setSelectedReport(report);
    setViewOpen(true);
  };

  const openResolve = (report: DamageReport) => {
    setSelectedReport(report);
    setResolutionNotes("");
    setResolveOpen(true);
  };

  const handleResolve = async () => {
    if (!selectedReport) return;

    const { data: authData } = await supabase.auth.getUser();
    const userId = authData.user?.id;

    await supabase
      .from("damage_reports")
      .update({
        status: "resolved",
        resolution_notes: resolutionNotes.trim() || null,
        resolved_by: userId,
      })
      .eq("id", selectedReport.id);

    // Notify the student who reported the damage
    const eqName = selectedReport.equipment?.name || "equipment";
    await createNotification(
      selectedReport.user_id,
      "Damage Report Resolved",
      `Your damage report for ${eqName} has been resolved.`,
      "damage_report",
      "damage_report",
      selectedReport.id
    );

    setResolveOpen(false);
    setSelectedReport(null);
    setResolutionNotes("");
    fetchData();
  };

  const handleDismiss = (id: string) => {
    withConfirm(async () => {
      await supabase
        .from("damage_reports")
        .update({ status: "dismissed" })
        .eq("id", id);

      fetchData();
    });
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <>
      <div>
        <div className="mb-6 rounded-xl border border-[#dde4ec] bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-xl font-bold text-navy">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-500">
                  <AlertTriangle className="h-4 w-4" />
                </span>
                Damage Reports
              </h2>
            </div>
            <Link href="/admin/activity-logs">
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

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { label: "Total Reports", value: stats.total, icon: AlertTriangle, color: "#6b7280" },
            { label: "Pending", value: stats.pending, icon: Wrench, color: "#f59e0b" },
            { label: "Resolved", value: stats.resolved, icon: CheckCircle, color: "#10b981" },
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

        <div className="mb-4 flex flex-wrap items-center gap-2">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition-all ${
                statusFilter === f.value
                  ? "border-teal bg-teal-light text-teal"
                  : "border-[#dde4ec] bg-white text-silver hover:border-teal hover:text-teal"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="ecp-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#dde4ec] bg-[#f8f9fa] text-xs font-semibold uppercase tracking-wider text-silver">
                  <th className="px-4 py-3">Reporter</th>
                  <th className="px-4 py-3">Equipment</th>
                  <th className="px-4 py-3">Severity</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-[#f0f0f0]">
                      <td className="px-4 py-3">
                        <Skeleton className="h-4 w-32" />
                      </td>
                      <td className="px-4 py-3">
                        <Skeleton className="h-4 w-40" />
                      </td>
                      <td className="px-4 py-3">
                        <Skeleton className="h-5 w-16 rounded-full" />
                      </td>
                      <td className="px-4 py-3">
                        <Skeleton className="h-5 w-20 rounded-full" />
                      </td>
                      <td className="px-4 py-3">
                        <Skeleton className="h-4 w-24" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Skeleton className="h-8 w-8 rounded" />
                          <Skeleton className="h-8 w-8 rounded" />
                          <Skeleton className="h-8 w-8 rounded" />
                        </div>
                      </td>
                    </tr>
                  ))
                ) : reports.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-16 text-center">
                      <AlertTriangle className="mx-auto mb-3 h-10 w-10 text-silver/40" />
                      <p className="text-sm font-medium text-silver">
                        No damage reports found
                      </p>
                      <p className="mt-1 text-xs text-silver/60">
                        {statusFilter === "all"
                          ? "Everything looks good!"
                          : "No reports match the selected filter."}
                      </p>
                    </td>
                  </tr>
                ) : (
                  reports.map((r) => {
                    const sevCfg = SEVERITY_CONFIG[r.severity] || SEVERITY_CONFIG.minor;
                    const stCfg = STATUS_CONFIG[r.status] || STATUS_CONFIG.pending;

                    return (
                      <tr
                        key={r.id}
                        className="border-b border-[#f0f0f0] hover:bg-[#f8f9fa]"
                      >
                        <td className="px-4 py-3 font-medium text-navy">
                          {r.users?.full_name || "Unknown"}
                        </td>
                        <td className="px-4 py-3 text-silver">
                          {r.equipment?.name || "-"}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase ${sevCfg.className}`}
                          >
                            {sevCfg.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase ${stCfg.className}`}
                          >
                            {stCfg.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-silver">
                          {formatDate(r.created_at)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openView(r)}
                              className="h-8 w-8 p-0"
                            >
                              <Eye className="h-3.5 w-3.5 text-slate" />
                            </Button>
                            {r.status === "pending" && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openResolve(r)}
                                  className="h-8 w-8 p-0"
                                  title="Resolve"
                                >
                                  <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDismiss(r.id)}
                                  className="h-8 w-8 p-0"
                                  title="Dismiss"
                                >
                                  <XCircle className="h-3.5 w-3.5 text-red-400" />
                                </Button>
                              </>
                            )}
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

        <Dialog open={viewOpen} onOpenChange={setViewOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-navy">Damage Report Details</DialogTitle>
              <DialogDescription className="text-silver">
                Report ID:{" "}
                <span className="font-mono text-xs">
                  {selectedReport?.id.slice(0, 8)}
                </span>
              </DialogDescription>
            </DialogHeader>

            {selectedReport && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs font-medium uppercase text-silver">
                      Reporter
                    </p>
                    <p className="mt-0.5 font-medium text-navy">
                      {selectedReport.users?.full_name || "Unknown"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase text-silver">
                      Equipment
                    </p>
                    <p className="mt-0.5 font-medium text-navy">
                      {selectedReport.equipment?.name || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase text-silver">
                      Severity
                    </p>
                    <span
                      className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase ${
                        SEVERITY_CONFIG[selectedReport.severity]?.className || ""
                      }`}
                    >
                      {SEVERITY_CONFIG[selectedReport.severity]?.label || selectedReport.severity}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase text-silver">
                      Status
                    </p>
                    <span
                      className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase ${
                        STATUS_CONFIG[selectedReport.status]?.className || ""
                      }`}
                    >
                      {STATUS_CONFIG[selectedReport.status]?.label || selectedReport.status}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs font-medium uppercase text-silver">
                      Date Reported
                    </p>
                    <p className="mt-0.5 text-navy">
                      {new Date(selectedReport.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs font-medium uppercase text-silver">
                      Description
                    </p>
                    <p className="mt-1 rounded-lg border border-[#dde4ec] bg-[#f8f9fa] p-3 text-sm text-navy">
                      {selectedReport.description || "-"}
                    </p>
                  </div>

                  {selectedReport.image_urls &&
                    Array.isArray(selectedReport.image_urls) &&
                    selectedReport.image_urls.length > 0 && (
                      <div className="col-span-2">
                        <p className="text-xs font-medium uppercase text-silver">
                          Images
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {selectedReport.image_urls.map((url, idx) => (
                            <img
                              key={idx}
                              src={url}
                              alt={`Damage ${idx + 1}`}
                              className="h-24 w-24 rounded-lg border border-[#dde4ec] object-cover"
                            />
                          ))}
                        </div>
                      </div>
                    )}

                  {selectedReport.status === "resolved" &&
                    selectedReport.resolution_notes && (
                      <div className="col-span-2">
                        <p className="text-xs font-medium uppercase text-silver">
                          Resolution Notes
                        </p>
                        <p className="mt-1 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                          {selectedReport.resolution_notes}
                        </p>
                      </div>
                    )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={resolveOpen} onOpenChange={setResolveOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-navy">Resolve Damage Report</DialogTitle>
              <DialogDescription className="text-silver">
                Add resolution notes to mark this report as resolved.
              </DialogDescription>
            </DialogHeader>

            {selectedReport && (
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-medium uppercase text-silver">
                    Equipment
                  </p>
                  <p className="mt-0.5 text-sm font-medium text-navy">
                    {selectedReport.equipment?.name || "-"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase text-silver">
                    Description
                  </p>
                  <p className="mt-0.5 text-sm text-silver">
                    {selectedReport.description || "-"}
                  </p>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate">
                    Resolution Notes
                  </label>
                  <Textarea
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    placeholder="Describe how the damage was handled or resolved..."
                    rows={4}
                    className="mt-1 border-[#dde4ec]"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setResolveOpen(false);
                  setSelectedReport(null);
                  setResolutionNotes("");
                }}
                className="border-[#dde4ec]"
              >
                Cancel
              </Button>
              <Button
                onClick={handleResolve}
                className="bg-green-500 hover:bg-green-600"
              >
                <CheckCircle className="mr-1 h-3.5 w-3.5" />
                Mark as Resolved
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Dismiss Report?"
        description="Are you sure you want to dismiss this damage report?"
        confirmLabel="Dismiss"
        variant="warning"
        onConfirm={() => { confirmAction?.(); setConfirmOpen(false); }}
      />
    </>
  );
}
