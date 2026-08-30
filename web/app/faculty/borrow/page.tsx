"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { logActivity } from "@/lib/logger";
import { createNotification } from "@/lib/notifications";
import { studentNotifications } from "@/lib/notification-templates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Search,
  Eye,
  CheckCircle,
  XCircle,
  HandHelping,
  GraduationCap,
  Users,
  PackageCheck,
} from "lucide-react";

const DEPT_CATEGORY_FILTER: Record<string, string[]> = {
  Engineering: ["Electronics"],
  Science: ["Chemistry", "Physics"],
};

interface User {
  id: string;
  full_name: string;
}

interface Equipment {
  id: string;
  name: string;
  department: string | null;
  categories?: { name: string } | null;
}

interface BorrowItem {
  id: string;
  equipment_id: string;
  quantity: number;
  returned_quantity: number;
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
  denied_reason: string | null;
  created_at: string;
  users?: User;
  borrow_items?: BorrowItem[];
}

type StatusFilter =
  | "all"
  | "pending"
  | "approved"
  | "borrowed"
  | "overdue"
  | "return_requested"
  | "returned"
  | "damaged"
  | "rejected";

const STATUS_VARIANTS: Record<string, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-amber-100 text-amber-700" },
  approved: { label: "Approved", className: "bg-blue-100 text-blue-700" },
  borrowed: { label: "Borrowed", className: "bg-indigo-100 text-indigo-700" },
  returned: { label: "Returned", className: "bg-green-100 text-green-700" },
  denied: { label: "Rejected", className: "bg-red-100 text-red-700" },
  rejected: { label: "Rejected", className: "bg-red-100 text-red-700" },
  return_requested: { label: "Return Request", className: "bg-teal-100 text-teal-700" },
  damaged: { label: "Damaged", className: "bg-red-100 text-red-700" },
};

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "borrowed", label: "Borrowed" },
  { value: "overdue", label: "Overdue" },
  { value: "return_requested", label: "Return Request" },
  { value: "returned", label: "Returned" },
  { value: "damaged", label: "Damaged" },
  { value: "rejected", label: "Rejected" },
];

export default function FacultyBorrowingsPage() {
  const supabase = createClient();

  const [requests, setRequests] = useState<BorrowRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");

  const [viewOpen, setViewOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<BorrowRequest | null>(null);

  const [denyOpen, setDenyOpen] = useState(false);
  const [denyTarget, setDenyTarget] = useState<BorrowRequest | null>(null);
  const [denyReason, setDenyReason] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

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

    const { data } = await supabase
      .from("borrow_requests")
      .select(
        "*, users!borrow_requests_user_id_fkey(id, full_name), borrow_items(*, equipment(id, name, department, category_id, categories(name)))"
      )
      .eq("request_type", "student")
      .order("created_at", { ascending: false });

    const allowed = dept ? DEPT_CATEGORY_FILTER[dept] : null;
    let list = ((data as BorrowRequest[]) || []).filter((r) =>
      allowed
        ? (r.borrow_items || []).some((bi) =>
            allowed.includes(bi.equipment?.categories?.name || "")
          )
        : true
    );

    if (statusFilter === "rejected") {
      list = list.filter((r) => r.status === "denied" || r.status === "rejected");
    } else if (statusFilter === "overdue") {
      list = list.filter((r) => r.status === "approved" || r.status === "borrowed");
    } else if (statusFilter !== "all") {
      list = list.filter((r) => r.status === statusFilter);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((r) => (r.users?.full_name || "").toLowerCase().includes(q));
    }

    setRequests(list);
    setLoading(false);
  }, [supabase, statusFilter, search]);

  useEffect(() => {
    void (async () => {
      await fetchData();
    })();
  }, [fetchData]);

  const getTypeBadge = (type: string) => (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase ${
        type === "student"
          ? "bg-purple-100 text-purple-700"
          : "bg-sky-100 text-sky-700"
      }`}
    >
      {type === "student" ? <GraduationCap className="h-3 w-3" /> : <Users className="h-3 w-3" />}
      {type}
    </span>
  );

  const getStatusBadge = (req: BorrowRequest) => {
    if (
      (statusFilter !== "overdue" && req.return_date) &&
      (req.status === "approved" || req.status === "borrowed")
    ) {
      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      if (String(req.return_date).slice(0, 10) <= todayStr) {
        return (
          <span className="inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase bg-red-100 text-red-700">
            Overdue
          </span>
        );
      }
    }
    const config = STATUS_VARIANTS[req.status] || STATUS_VARIANTS.pending;
    return (
      <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const getItemsSummary = (req: BorrowRequest) => {
    const items = req.borrow_items || [];
    if (items.length === 0) return "-";
    return items.map((bi) => `${bi.quantity}\u00d7 ${bi.equipment?.name || "Unknown"}`).join(", ");
  };

  const formatDate = (d: string | null) => {
    if (!d) return "-";
    return new Date(d).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleApprove = async (req: BorrowRequest) => {
    setActionLoading(req.id);
    const { data: { user } } = await supabase.auth.getUser();
    await supabase
      .from("borrow_requests")
      .update({ status: "approved", approved_by: user?.id, approved_at: new Date().toISOString() })
      .eq("id", req.id);
    logActivity(user?.id, "approve", "borrow_request", req.id, { status: "approved" });
    const msg = studentNotifications.borrowApproved(
      (req.borrow_items || []).reduce((s, bi) => s + bi.quantity, 0),
      getItemsSummary(req)
    );
    await createNotification(req.user_id, msg.title, msg.message, "borrow_status", "borrow_request", req.id);
    setActionLoading(null);
    fetchData();
  };

  const openDeny = (req: BorrowRequest) => {
    setDenyTarget(req);
    setDenyReason("");
    setDenyOpen(true);
  };

  const handleReject = async () => {
    if (!denyTarget) return;
    setActionLoading(denyTarget.id);
    const { data: { user } } = await supabase.auth.getUser();
    await supabase
      .from("borrow_requests")
      .update({ status: "denied", denied_reason: denyReason })
      .eq("id", denyTarget.id);
    logActivity(user?.id, "reject", "borrow_request", denyTarget.id, { status: "denied", reason: denyReason });
    const msg = studentNotifications.borrowRejected(
      (denyTarget.borrow_items || []).reduce((s, bi) => s + bi.quantity, 0),
      getItemsSummary(denyTarget)
    );
    await createNotification(denyTarget.user_id, msg.title, msg.message, "borrow_status", "borrow_request", denyTarget.id);
    setActionLoading(null);
    setDenyOpen(false);
    setDenyTarget(null);
    fetchData();
  };

  const openView = (req: BorrowRequest) => {
    setSelectedRequest(req);
    setViewOpen(true);
  };

  return (
    <>
      <div>
        <div className="mb-6 rounded-xl border border-[#dde4ec] bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-xl font-bold text-navy">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-light text-teal">
                <HandHelping className="h-4 w-4" />
              </span>
              Borrowings
            </h2>
          </div>
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

        <div className="relative mb-4">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-silver" />
          <Input
            placeholder="Search by student name..."
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
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Items</th>
                  <th className="px-4 py-3">Borrow Date</th>
                  <th className="px-4 py-3">Return Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-[#f0f0f0]">
                      <td className="px-4 py-3"><Skeleton className="h-4 w-32" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-40" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-5 w-20 rounded-full" /></td>
                      <td className="px-4 py-3"><div className="flex justify-end gap-1"><Skeleton className="h-8 w-8 rounded" /><Skeleton className="h-8 w-8 rounded" /></div></td>
                    </tr>
                  ))
                ) : requests.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-16 text-center">
                      <PackageCheck className="mx-auto mb-3 h-10 w-10 text-silver/40" />
                      <p className="text-sm font-medium text-silver">No borrowings found</p>
                      <p className="mt-1 text-xs text-silver/60">
                        {statusFilter !== "all" || search
                          ? "No records match the selected filter."
                          : "No borrowings for your department yet."}
                      </p>
                    </td>
                  </tr>
                ) : (
                  requests.map((req) => (
                    <tr key={req.id} className="border-b border-[#f0f0f0] hover:bg-[#f8f9fa]">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-navy">{req.users?.full_name || "Unknown"}</span>
                          {getTypeBadge(req.request_type)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-silver">{getItemsSummary(req)}</td>
                      <td className="px-4 py-3 text-silver">{formatDate(req.borrow_date)}</td>
                      <td className="px-4 py-3 text-silver">{formatDate(req.return_date)}</td>
                      <td className="px-4 py-3">{getStatusBadge(req)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openView(req)} className="h-8 w-8 p-0" title="View">
                            <Eye className="h-3.5 w-3.5 text-slate" />
                          </Button>
                          {req.status === "pending" && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleApprove(req)}
                                disabled={actionLoading === req.id}
                                className="h-8 w-8 p-0"
                                title="Approve"
                              >
                                <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openDeny(req)}
                                className="h-8 w-8 p-0"
                                title="Reject"
                              >
                                <XCircle className="h-3.5 w-3.5 text-red-400" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* View modal */}
        <Dialog open={viewOpen} onOpenChange={setViewOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-navy">Borrowing Details</DialogTitle>
              <DialogDescription className="text-silver">
                Request ID: <span className="font-mono text-xs">{selectedRequest?.id.slice(0, 8)}</span>
              </DialogDescription>
            </DialogHeader>
            {selectedRequest && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs font-medium uppercase text-silver">Student</p>
                    <p className="mt-0.5 font-medium text-navy">{selectedRequest.users?.full_name || "Unknown"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase text-silver">Type</p>
                    <p className="mt-0.5">{getTypeBadge(selectedRequest.request_type)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase text-silver">Borrow Date</p>
                    <p className="mt-0.5 text-navy">{formatDate(selectedRequest.borrow_date)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase text-silver">Return Date</p>
                    <p className="mt-0.5 text-navy">{formatDate(selectedRequest.return_date)}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs font-medium uppercase text-silver">Status</p>
                    <p className="mt-1">{getStatusBadge(selectedRequest)}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs font-medium uppercase text-silver">Purpose</p>
                    <p className="mt-0.5 text-navy">{selectedRequest.purpose || "-"}</p>
                  </div>
                  {selectedRequest.denied_reason && (
                    <div className="col-span-2">
                      <p className="text-xs font-medium uppercase text-silver">Reject Reason</p>
                      <p className="mt-0.5 text-red-600">{selectedRequest.denied_reason}</p>
                    </div>
                  )}
                </div>

                {selectedRequest.borrow_items && selectedRequest.borrow_items.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-medium uppercase text-silver">Items</p>
                    <div className="rounded-lg border border-[#dde4ec]">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-[#dde4ec] bg-[#f8f9fa] text-xs font-semibold text-silver">
                            <th className="px-3 py-2">Equipment</th>
                            <th className="px-3 py-2 text-center">Qty</th>
                            <th className="px-3 py-2 text-center">Returned</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedRequest.borrow_items.map((bi) => (
                            <tr key={bi.id} className="border-b border-[#f0f0f0] last:border-0">
                              <td className="px-3 py-2 font-medium text-navy">{bi.equipment?.name || "Unknown"}</td>
                              <td className="px-3 py-2 text-center">{bi.quantity}</td>
                              <td className="px-3 py-2 text-center">{bi.returned_quantity}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setViewOpen(false)} className="border-[#dde4ec]">
                    Close
                  </Button>
                  {selectedRequest.status === "pending" && (
                    <>
                      <Button variant="outline" onClick={() => { setViewOpen(false); openDeny(selectedRequest); }} className="border-red-200 text-red-500 hover:bg-red-50">
                        <XCircle className="h-3.5 w-3.5" /> Reject
                      </Button>
                      <Button onClick={() => handleApprove(selectedRequest)} className="gap-1.5 bg-teal hover:bg-teal-dark">
                        <CheckCircle className="h-3.5 w-3.5" /> Approve
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Reject modal */}
        <Dialog open={denyOpen} onOpenChange={setDenyOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-navy">Reject Borrow Request</DialogTitle>
              <DialogDescription className="text-silver">Provide a reason for rejecting this request.</DialogDescription>
            </DialogHeader>
            <div>
              <label className="text-xs font-medium text-slate">Reason *</label>
              <Input
                value={denyReason}
                onChange={(e) => setDenyReason(e.target.value)}
                placeholder="Enter reason..."
                className="mt-1 border-[#dde4ec]"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDenyOpen(false)} className="border-[#dde4ec]">
                Cancel
              </Button>
              <Button onClick={handleReject} disabled={!denyReason.trim()} className="bg-red-500 hover:bg-red-600">
                Reject
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
