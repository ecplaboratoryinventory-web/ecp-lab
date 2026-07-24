"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  Calendar,
  PackageCheck,
  Clock,
  CheckCircle,
  Search,
} from "lucide-react";

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

interface User {
  id: string;
  full_name: string;
}

interface BorrowRequest {
  id: string;
  user_id: string;
  request_type: string;
  status: string;
  purpose: string;
  borrow_date: string;
  return_date: string;
  actual_return_date: string | null;
  approved_at: string | null;
  denied_reason: string | null;
  notes: string | null;
  created_at: string;
  users?: User;
  borrow_items?: BorrowItem[];
}

const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "borrowed", label: "Borrowed" },
  { value: "returned", label: "Returned" },
  { value: "approved", label: "Approved" },
  { value: "pending", label: "Pending" },
  { value: "denied", label: "Denied" },
  { value: "overdue", label: "Overdue" },
];

const STATUS_VARIANTS: Record<string, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-amber-100 text-amber-700" },
  approved: { label: "Approved", className: "bg-blue-100 text-blue-700" },
  borrowed: { label: "Borrowed", className: "bg-indigo-100 text-indigo-700" },
  returned: { label: "Returned", className: "bg-green-100 text-green-700" },
  denied: { label: "Denied", className: "bg-red-100 text-red-700" },
  overdue: { label: "Overdue", className: "bg-red-100 text-red-700" },
};

const PAGE_SIZE = 10;

function HistoryContent() {
  const supabase = createClient();
  const searchParams = useSearchParams();

  const [requests, setRequests] = useState<BorrowRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const [stats, setStats] = useState({ total: 0, active: 0, returned: 0 });

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailRequest, setDetailRequest] = useState<BorrowRequest | null>(
    null,
  );

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

  useEffect(() => {
    const status = searchParams.get("status");
    if (status) setStatusFilter(status);
  }, [searchParams]);

  const fetchRequests = useCallback(async () => {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    let query = supabase
      .from("borrow_requests")
      .select(
        "*, users!borrow_requests_user_id_fkey(full_name), borrow_items(*, equipment(id, name))",
        { count: "exact" },
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (dateFrom) {
      query = query.gte("created_at", `${dateFrom}T00:00:00`);
    }
    if (dateTo) {
      query = query.lte("created_at", `${dateTo}T23:59:59`);
    }
    if (statusFilter !== "all" && statusFilter !== "overdue") {
      query = query.eq("status", statusFilter);
    }
    if (statusFilter === "overdue") {
      query = query.eq("status", "borrowed");
    }
    if (searchTerm) {
      query = query.or(
        `id.ilike.%${searchTerm}%,purpose.ilike.%${searchTerm}%`,
      );
    }

    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, count } = await query.range(from, to);

    let result = (data as BorrowRequest[]) || [];

    if (statusFilter === "overdue") {
      const now = Date.now();
      result = result.filter((req) => {
        if (!req.borrow_date) return false;
        return new Date(req.borrow_date).getTime() + 3 * 60 * 60 * 1000 < now;
      });
    }

    setRequests(result);
    setTotalCount(count || 0);
    setLoading(false);
  }, [dateFrom, dateTo, statusFilter, searchTerm, page, userDept]);

  const fetchStats = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const baseQuery = () =>
      supabase
        .from("borrow_requests")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

    const [
      { count: total },
      { count: active },
      { count: returned },
    ] = await Promise.all([
      baseQuery(),
      baseQuery().eq("status", "borrowed"),
      baseQuery().eq("status", "returned"),
    ]);

    setStats({
      total: total || 0,
      active: active || 0,
      returned: returned || 0,
    });
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const formatDate = (date: string | null) => {
    if (!date) return "-";
    return new Date(date + "T00:00:00").toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
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

  const getItemsSummary = (items: BorrowItem[] | undefined) => {
    if (!items || items.length === 0) return "-";
    return items
      .map((bi) => `${bi.quantity}x ${bi.equipment?.name || "Unknown"}`)
      .join(", ");
  };

  const openDetail = (req: BorrowRequest) => {
    setDetailRequest(req);
    setDetailOpen(true);
  };

  return (
    <div>
      <div className="mb-6 rounded-xl border border-[#dde4ec] bg-gradient-to-r from-navy to-[#253348] p-6 shadow-sm">
        <h2 className="flex items-center gap-2 text-xl font-bold text-white">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal/20 text-teal">
            <ClipboardList className="h-4 w-4" />
          </span>
          Borrow History
        </h2>
        <p className="mt-1 text-sm text-white/70">
          View and track your equipment borrow history
        </p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          {
            label: "Total Borrows",
            value: stats.total,
            icon: ClipboardList,
            color: "#3b82f6",
          },
          {
            label: "Active",
            value: stats.active,
            icon: Clock,
            color: "#f59e0b",
          },
          {
            label: "Returned",
            value: stats.returned,
            icon: CheckCircle,
            color: "#10b981",
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

      <div className="ecp-card mb-4 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-silver" />
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPage(1);
              }}
              className="w-40 border-[#dde4ec] text-sm"
              placeholder="From"
            />
          </div>
          <span className="text-xs text-silver">to</span>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              setPage(1);
            }}
            className="w-40 border-[#dde4ec] text-sm"
            placeholder="To"
          />

          <div className="h-6 w-px bg-[#dde4ec]" />

          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v || "all");
              setPage(1);
            }}
          >
            <SelectTrigger className="w-36 border-[#dde4ec] text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-silver" />
            <Input
              placeholder="Search by ID or purpose..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full border-[#dde4ec] pl-10 text-sm"
            />
          </div>
        </div>
      </div>

      <div className="ecp-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#dde4ec] bg-[#f8f9fa] text-xs font-semibold uppercase tracking-wider text-silver">
                <th className="px-4 py-3">Request ID</th>
                <th className="px-4 py-3">Items</th>
                <th className="px-4 py-3">Borrow Date</th>
                <th className="px-4 py-3">Expected Return</th>
                <th className="px-4 py-3">Actual Return</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-[#f0f0f0]">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <Skeleton className="h-4 w-full rounded bg-[#f0f0f0]" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : requests.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-16 text-center"
                  >
                    <ClipboardList className="mx-auto mb-3 h-10 w-10 text-silver/40" />
                    <p className="text-sm font-medium text-silver">
                      No borrow history found
                    </p>
                    <p className="mt-1 text-xs text-silver/60">
                      {dateFrom || dateTo || statusFilter !== "all"
                        ? "Try adjusting your filters"
                        : "Your borrow history will appear here"}
                    </p>
                  </td>
                </tr>
              ) : (
                requests.map((req) => (
                  <tr
                    key={req.id}
                    className="border-b border-[#f0f0f0] hover:bg-[#f8f9fa]"
                  >
                    <td className="px-4 py-3 font-mono text-xs font-medium text-navy">
                      {req.id.substring(0, 8)}...
                    </td>
                    <td className="max-w-[200px] truncate px-4 py-3 text-xs text-silver">
                      {getItemsSummary(req.borrow_items)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-slate">
                      {formatDate(req.borrow_date)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-slate">
                      {formatDate(req.return_date)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-slate">
                      {formatDate(req.actual_return_date)}
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(req.status)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDetail(req)}
                        className="border-[#dde4ec] text-xs"
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-[#dde4ec] px-4 py-3">
            <p className="text-xs text-silver">
              Showing {(page - 1) * PAGE_SIZE + 1}–
              {Math.min(page * PAGE_SIZE, totalCount)} of {totalCount} entries
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="border-[#dde4ec] text-xs"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              {Array.from(
                { length: Math.min(totalPages, 5) },
                (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
                  return (
                    <Button
                      key={pageNum}
                      variant={page === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPage(pageNum)}
                      className={
                        page === pageNum
                          ? "bg-teal text-white"
                          : "border-[#dde4ec] text-xs"
                      }
                    >
                      {pageNum}
                    </Button>
                  );
                },
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="border-[#dde4ec] text-xs"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-navy">
              Borrow Request Details
            </DialogTitle>
          </DialogHeader>

          {detailRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[11px] font-medium uppercase text-silver">
                    Request ID
                  </p>
                  <p className="mt-0.5 font-mono text-xs text-navy">
                    {detailRequest.id.substring(0, 8)}...
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-medium uppercase text-silver">
                    Status
                  </p>
                  <div className="mt-0.5">
                    {getStatusBadge(detailRequest.status)}
                  </div>
                </div>
                <div>
                  <p className="text-[11px] font-medium uppercase text-silver">
                    Borrow Date
                  </p>
                  <p className="mt-0.5 text-sm text-navy">
                    {formatDate(detailRequest.borrow_date)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-medium uppercase text-silver">
                    Expected Return
                  </p>
                  <p className="mt-0.5 text-sm text-navy">
                    {formatDate(detailRequest.return_date)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-medium uppercase text-silver">
                    Actual Return
                  </p>
                  <p className="mt-0.5 text-sm text-navy">
                    {formatDate(detailRequest.actual_return_date)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-medium uppercase text-silver">
                    Requested By
                  </p>
                  <p className="mt-0.5 text-sm text-navy">
                    {detailRequest.users?.full_name || "Unknown"}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-[11px] font-medium uppercase text-silver">
                  Purpose
                </p>
                <p className="mt-0.5 text-sm text-navy">
                  {detailRequest.purpose || "-"}
                </p>
              </div>

              {detailRequest.notes && (
                <div>
                  <p className="text-[11px] font-medium uppercase text-silver">
                    Notes
                  </p>
                  <p className="mt-0.5 text-sm text-navy">
                    {detailRequest.notes}
                  </p>
                </div>
              )}

              {detailRequest.denied_reason && (
                <div>
                  <p className="text-[11px] font-medium uppercase text-silver">
                    Denial Reason
                  </p>
                  <p className="mt-0.5 text-sm text-red-600">
                    {detailRequest.denied_reason}
                  </p>
                </div>
              )}

              {detailRequest.borrow_items &&
                detailRequest.borrow_items.length > 0 && (
                  <div>
                    <p className="mb-2 text-[11px] font-medium uppercase text-silver">
                      Items ({detailRequest.borrow_items.length})
                    </p>
                    <div className="rounded-lg border border-[#dde4ec]">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-[#dde4ec] bg-[#f8f9fa] text-[11px] font-semibold text-silver">
                            <th className="px-3 py-2">Equipment</th>
                            <th className="px-3 py-2 text-center">Qty</th>
                            <th className="px-3 py-2 text-center">
                              Returned
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {detailRequest.borrow_items.map((bi) => (
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
                              <td className="px-3 py-2 text-center text-silver">
                                {bi.returned_quantity}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

              <div>
                <p className="text-[11px] font-medium uppercase text-silver">
                  Created
                </p>
                <p className="mt-0.5 text-sm text-navy">
                  {new Date(detailRequest.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function HistoryPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-silver">Loading...</div>}>
      <HistoryContent />
    </Suspense>
  );
}
