"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Toaster, toast } from "@/components/ui/toast";
import {
  Clock,
  CheckCircle,
  CalendarCheck,
  BarChart3,
  RefreshCw,
  User,
  ChevronDown,
  ChevronUp,
  Calendar,
  FileText,
  GraduationCap,
  XCircle,
  Check,
  Loader2,
} from "lucide-react";

interface User {
  id: string;
  full_name: string;
}

interface Equipment {
  id: string;
  name: string;
}

interface BorrowItem {
  id: string;
  equipment_id: string;
  quantity: number;
  returned_quantity: number;
  notes: string | null;
  equipment?: Equipment;
}

interface BorrowRequest {
  id: string;
  user_id: string;
  request_type: string;
  status: string;
  purpose: string;
  borrow_date: string;
  return_date: string;
  approved_at: string | null;
  approved_by: string | null;
  denied_reason: string | null;
  notes: string | null;
  created_at: string;
  users?: User;
  borrow_items?: BorrowItem[];
}

type StatusTab = "pending" | "approved" | "denied";

const STATUS_VARIANTS: Record<string, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-amber-100 text-amber-700" },
  approved: { label: "Approved", className: "bg-blue-100 text-blue-700" },
  borrowed: { label: "Borrowed", className: "bg-indigo-100 text-indigo-700" },
  returned: { label: "Returned", className: "bg-green-100 text-green-700" },
  denied: { label: "Denied", className: "bg-red-100 text-red-700" },
};

export default function ApprovalsPage() {
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState<StatusTab>("pending");
  const [requests, setRequests] = useState<BorrowRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [stats, setStats] = useState({ pending: 0, approvedToday: 0, totalThisMonth: 0 });

  const [denyOpen, setDenyOpen] = useState(false);
  const [denyTarget, setDenyTarget] = useState<BorrowRequest | null>(null);
  const [denyReason, setDenyReason] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);

    let query = supabase
      .from("borrow_requests")
      .select(
        "*, users!borrow_requests_user_id_fkey(id, full_name), borrow_items(*, equipment(id, name))"
      )
      .eq("request_type", "student")
      .order("created_at", { ascending: false });

    if (activeTab === "denied") {
      query = query.in("status", ["denied", "rejected"]);
    } else {
      query = query.eq("status", activeTab);
    }

    const { data } = await query;
    setRequests((data as BorrowRequest[]) || []);
    setLoading(false);
  }, [activeTab]);

  const fetchStats = useCallback(async () => {
    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    ).toISOString();
    const monthStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    ).toISOString();

    const { count: pending } = await supabase
      .from("borrow_requests")
      .select("*", { count: "exact", head: true })
      .eq("request_type", "student")
      .eq("status", "pending");

    const { count: approvedToday } = await supabase
      .from("borrow_requests")
      .select("*", { count: "exact", head: true })
      .eq("request_type", "student")
      .eq("status", "approved")
      .gte("approved_at", todayStart);

    const { count: totalThisMonth } = await supabase
      .from("borrow_requests")
      .select("*", { count: "exact", head: true })
      .eq("request_type", "student")
      .gte("created_at", monthStart);

    setStats({
      pending: pending || 0,
      approvedToday: approvedToday || 0,
      totalThisMonth: totalThisMonth || 0,
    });
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    const channel = supabase
      .channel('faculty-approvals-borrow-requests')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'borrow_requests' }, () => fetchData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const reload = () => {
    fetchData();
    fetchStats();
  };

  const handleApprove = async (req: BorrowRequest) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    setActionLoading(req.id);
    const { error } = await supabase
      .from("borrow_requests")
      .update({
        status: "approved",
        approved_by: user.id,
        approved_at: new Date().toISOString(),
      })
      .eq("id", req.id);

    if (error) {
      toast.add({
        title: "Error",
        description: "Failed to approve request",
        type: "error",
      });
    } else {
      toast.add({
        title: "Approved",
        description: `${req.users?.full_name || "Student"}'s request has been approved`,
        type: "success",
      });
    }
    setActionLoading(null);
    reload();
  };

  const openDeny = (req: BorrowRequest) => {
    setDenyTarget(req);
    setDenyReason("");
    setDenyOpen(true);
  };

  const handleDeny = async () => {
    if (!denyTarget || !denyReason.trim()) return;

    setActionLoading(denyTarget.id);
    const { error } = await supabase
      .from("borrow_requests")
      .update({
        status: "denied",
        denied_reason: denyReason.trim(),
      })
      .eq("id", denyTarget.id);

    if (error) {
      toast.add({
        title: "Error",
        description: "Failed to deny request",
        type: "error",
      });
    } else {
      toast.add({
        title: "Denied",
        description: `${denyTarget.users?.full_name || "Student"}'s request has been denied`,
        type: "success",
      });
    }
    setActionLoading(null);
    setDenyOpen(false);
    setDenyTarget(null);
    setDenyReason("");
    reload();
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getStatusBadge = (status: string) => {
    const config = STATUS_VARIANTS[status] || STATUS_VARIANTS.pending;
    return (
      <span
        className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase ${config.className}`}
      >
        {config.label}
      </span>
    );
  };

  const formatDate = (date: string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const TABS: { value: StatusTab; label: string }[] = [
    { value: "pending", label: "Pending" },
    { value: "approved", label: "Approved" },
    { value: "denied", label: "Denied" },
  ];

  return (
    <Toaster>
      <div>
        <div className="mb-6 rounded-xl border border-[#dde4ec] bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-xl font-bold text-navy">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-light text-teal">
                  <CheckCircle className="h-4 w-4" />
                </span>
                Student Approvals
              </h2>
              <p className="mt-0.5 text-sm text-silver">
                Manage student borrow requests
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={reload}
              className="gap-1.5 border-[#dde4ec]"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </Button>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            {
              label: "Pending",
              value: stats.pending,
              icon: Clock,
              color: "#f59e0b",
            },
            {
              label: "Approved Today",
              value: stats.approvedToday,
              icon: CalendarCheck,
              color: "#10b981",
            },
            {
              label: "Total This Month",
              value: stats.totalThisMonth,
              icon: BarChart3,
              color: "#3b82f6",
            },
          ].map((s) => (
            <div key={s.label} className="ecp-stat-card">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-silver">{s.label}</p>
                  <p className="mt-1 text-3xl font-bold text-navy">
                    {s.value}
                  </p>
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
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => {
                setActiveTab(tab.value);
                setExpandedId(null);
              }}
              className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition-all ${
                activeTab === tab.value
                  ? "border-teal bg-teal-light text-teal"
                  : "border-[#dde4ec] bg-white text-silver hover:border-teal hover:text-teal"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="ecp-card animate-pulse p-5">
                <div className="mb-3 h-4 w-40 rounded bg-[#f0f0f0]" />
                <div className="mb-2 h-3 w-60 rounded bg-[#f0f0f0]" />
                <div className="h-5 w-20 rounded-full bg-[#f0f0f0]" />
              </div>
            ))}
          </div>
        ) : requests.length === 0 ? (
          <div className="ecp-card flex flex-col items-center justify-center py-16">
            <GraduationCap className="mb-3 h-10 w-10 text-silver" />
            <p className="text-base font-medium text-silver">
              No {activeTab} requests
            </p>
            <p className="mt-1 text-sm text-silver">
              {activeTab === "pending"
                ? "All student requests have been reviewed"
                : "No requests found for this filter"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((req) => (
              <div key={req.id} className="ecp-card overflow-hidden">
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-light">
                          <User className="h-4 w-4 text-teal" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-navy">
                            {req.users?.full_name || "Unknown Student"}
                          </h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            {getStatusBadge(req.status)}
                            <span className="text-xs text-silver">
                              {formatDate(req.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {activeTab === "pending" && (
                      <div className="flex gap-1.5 shrink-0 ml-3">
                        <Button
                          size="sm"
                          onClick={() => handleApprove(req)}
                          disabled={actionLoading === req.id}
                          className="gap-1 bg-green-500 hover:bg-green-600"
                        >
                          {actionLoading === req.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Check className="h-3 w-3" />
                          )}
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openDeny(req)}
                          disabled={actionLoading === req.id}
                          className="gap-1 border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600"
                        >
                          <XCircle className="h-3 w-3" />
                          Deny
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-silver">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(req.borrow_date)} – {formatDate(req.return_date)}
                    </span>
                    <span className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      {req.purpose.length > 60
                        ? req.purpose.slice(0, 60) + "..."
                        : req.purpose}
                    </span>
                  </div>

                  {req.borrow_items && req.borrow_items.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {req.borrow_items.map((bi) => (
                        <span
                          key={bi.id}
                          className="inline-flex items-center gap-1 rounded-full bg-teal-light px-2 py-0.5 text-[11px] font-medium text-teal"
                        >
                          {bi.quantity}× {bi.equipment?.name || "Unknown"}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-t border-[#dde4ec] bg-[#f8f9fa]">
                  <button
                    onClick={() => toggleExpand(req.id)}
                    className="flex w-full items-center justify-between px-5 py-2.5 text-xs font-medium text-silver hover:text-navy transition-colors"
                  >
                    {expandedId === req.id ? "Hide details" : "View details"}
                    {expandedId === req.id ? (
                      <ChevronUp className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5" />
                    )}
                  </button>

                  {expandedId === req.id && (
                    <div className="px-5 pb-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-[11px] font-medium uppercase text-silver">
                            Purpose
                          </p>
                          <p className="mt-0.5 text-sm text-navy">
                            {req.purpose || "-"}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] font-medium uppercase text-silver">
                            Request Created
                          </p>
                          <p className="mt-0.5 text-sm text-navy">
                            {new Date(req.created_at).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] font-medium uppercase text-silver">
                            Borrow Date
                          </p>
                          <p className="mt-0.5 text-sm text-navy">
                            {formatDate(req.borrow_date)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] font-medium uppercase text-silver">
                            Return Date
                          </p>
                          <p className="mt-0.5 text-sm text-navy">
                            {formatDate(req.return_date)}
                          </p>
                        </div>

                        {req.notes && (
                          <div className="col-span-2">
                            <p className="text-[11px] font-medium uppercase text-silver">
                              Notes
                            </p>
                            <p className="mt-0.5 text-sm text-navy">
                              {req.notes}
                            </p>
                          </div>
                        )}

                        {req.approved_at && (
                          <div>
                            <p className="text-[11px] font-medium uppercase text-silver">
                              Approved At
                            </p>
                            <p className="mt-0.5 text-sm text-navy">
                              {new Date(req.approved_at).toLocaleString()}
                            </p>
                          </div>
                        )}

                        {req.denied_reason && (
                          <div className="col-span-2">
                            <p className="text-[11px] font-medium uppercase text-silver">
                              Denial Reason
                            </p>
                            <p className="mt-0.5 text-sm text-red-600">
                              {req.denied_reason}
                            </p>
                          </div>
                        )}
                      </div>

                      {req.borrow_items && req.borrow_items.length > 0 && (
                        <div className="mt-3">
                          <p className="mb-1.5 text-[11px] font-medium uppercase text-silver">
                            Requested Items
                          </p>
                          <div className="rounded-lg border border-[#dde4ec]">
                            <table className="w-full text-left text-xs">
                              <thead>
                                <tr className="border-b border-[#dde4ec] bg-[#f8f9fa] text-[11px] font-semibold text-silver">
                                  <th className="px-3 py-2">Equipment</th>
                                  <th className="px-3 py-2 text-center">
                                    Qty
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {req.borrow_items.map((bi) => (
                                  <tr
                                    key={bi.id}
                                    className="border-b border-[#f0f0f0] last:border-0"
                                  >
                                    <td className="px-3 py-2 font-medium text-navy">
                                      {bi.equipment?.name || "Unknown"}
                                    </td>
                                    <td className="px-3 py-2 text-center text-silver">
                                      {bi.quantity}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <Dialog open={denyOpen} onOpenChange={setDenyOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-navy">
                Deny Borrow Request
              </DialogTitle>
              <DialogDescription className="text-silver">
                Provide a reason for denying{" "}
                <span className="font-medium text-navy">
                  {denyTarget?.users?.full_name || "this student"}
                </span>
                &apos;s request.
              </DialogDescription>
            </DialogHeader>

            <div>
              <label className="text-xs font-medium text-slate">
                Reason <span className="text-red-400">*</span>
              </label>
              <Textarea
                value={denyReason}
                onChange={(e) => setDenyReason(e.target.value)}
                placeholder="Enter reason for denial..."
                className="mt-1 min-h-[80px] border-[#dde4ec]"
              />
            </div>

            <DialogFooter className="!border-none !bg-transparent !p-0">
              <Button
                variant="outline"
                onClick={() => {
                  setDenyOpen(false);
                  setDenyTarget(null);
                  setDenyReason("");
                }}
                className="border-[#dde4ec]"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeny}
                disabled={!denyReason.trim() || actionLoading === denyTarget?.id}
                className="gap-1 bg-red-500 hover:bg-red-600"
              >
                {actionLoading === denyTarget?.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <XCircle className="h-3.5 w-3.5" />
                )}
                Deny Request
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Toaster>
  );
}
