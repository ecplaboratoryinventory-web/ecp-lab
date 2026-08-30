"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { logActivity } from "@/lib/logger";
import { createNotification, notifyRole } from "@/lib/notifications";
import { adminNotifications, studentNotifications } from "@/lib/notification-templates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  PackageCheck,
  Clock,
  CheckCheck,
  GraduationCap,
  Users,
  RotateCcw,
  AlertTriangle,
} from "lucide-react";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";

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
  borrow_request_id: string;
  equipment_id: string;
  quantity: number;
  returned_quantity: number;
  condition_on_return: string | null;
  notes: string | null;
  equipment?: Equipment;
}

interface BorrowRequest {
  id: string;
  user_id: string;
  request_type: "student" | "faculty";
  status: "pending" | "approved" | "denied" | "borrowed" | "returned" | "rejected" | "return_requested" | "damaged";
  purpose: string;
  borrow_date: string;
  return_date: string;
  approved_at: string | null;
  denied_reason: string | null;
  notes: string | null;
  created_at: string;
  users?: User;
  borrow_items?: BorrowItem[];
}

interface ReturnItemForm {
  borrowItemId: string;
  equipmentName: string;
  quantityBorrowed: number;
  alreadyReturned: number;
  returningQuantity: number;
  condition: "good" | "damaged" | "lost";
}

interface DamageItemInfo {
  borrowItemId: string;
  equipmentId: string;
  equipmentName: string;
  condition: string;
  damageType: string;
}

const DAMAGE_TYPES: { value: string; label: string }[] = [
  { value: "minor_damage", label: "Minor Damage" },
  { value: "major_damage", label: "Major Damage" },
  { value: "missing_parts", label: "Missing Parts" },
  { value: "lost", label: "Lost" },
];

const DAMAGE_TYPE_TO_SEVERITY: Record<string, "minor" | "major" | "critical"> = {
  minor_damage: "minor",
  major_damage: "major",
  missing_parts: "major",
  lost: "critical",
};

type RequestType = "all" | "student" | "faculty";
type StatusFilter = "all" | "pending" | "borrowed" | "returned" | "rejected" | "return_requested" | "damaged" | "overdue";

const STATUS_VARIANTS: Record<string, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-amber-100 text-amber-700" },
  approved: { label: "Approved", className: "bg-blue-100 text-blue-700" },
  borrowed: { label: "Borrowed", className: "bg-indigo-100 text-indigo-700" },
  returned: { label: "Returned", className: "bg-green-100 text-green-700" },
  denied: { label: "Rejected", className: "bg-red-100 text-red-700" },
  rejected: { label: "Rejected", className: "bg-red-100 text-red-700" },
  return_requested: { label: "Return Requested", className: "bg-teal-100 text-teal-700" },
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

export default function BorrowRequestsPage() {
  const [activeTab, setActiveTab] = useState<RequestType>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [requests, setRequests] = useState<BorrowRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, pending: 0, active: 0, returned: 0 });

  const [viewOpen, setViewOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<BorrowRequest | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const [returnOpen, setReturnOpen] = useState(false);
  const [returnItems, setReturnItems] = useState<ReturnItemForm[]>([]);

  const [damageOpen, setDamageOpen] = useState(false);
  const [damageItems, setDamageItems] = useState<DamageItemInfo[]>([]);
  const [damageDescription, setDamageDescription] = useState("");

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);

  const withConfirm = (action: () => void) => {
    setConfirmAction(() => action);
    setConfirmOpen(true);
  };

  const supabase = createClient();

  const getEquipmentName = (req: BorrowRequest): string => {
    const items = req.borrow_items || [];
    if (items.length === 0) return "Unknown equipment";
    if (items.length === 1) return items[0].equipment?.name || "Unknown equipment";
    return `${items.length} items`;
  };

  const isActiveBorrow = (req: BorrowRequest) =>
    req.status === "borrowed" || req.status === "approved";

  const isPastDue = (req: BorrowRequest) => {
    if (!isActiveBorrow(req) || !req.return_date) return false;
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const returnDate = String(req.return_date).slice(0, 10);
    return returnDate <= todayStr;
  };

  const canReturnOrDamage = (req: BorrowRequest) =>
    req.status === "return_requested" || isPastDue(req);

  const fetchData = useCallback(async () => {
    setLoading(true);

    let query = supabase
      .from("borrow_requests")
      .select("*, users!borrow_requests_user_id_fkey(id, full_name), borrow_items(*, equipment(id, name))")
      .order("created_at", { ascending: false });

    if (activeTab !== "all") {
      query = query.eq("request_type", activeTab);
    }

    if (statusFilter !== "all") {
      if (statusFilter === "rejected") {
        query = query.in("status", ["denied", "rejected"]);
      } else if (statusFilter === "borrowed") {
        query = query.in("status", ["approved", "borrowed"]);
      } else if (statusFilter === "overdue") {
        query = query.in("status", ["approved", "borrowed"]);
      } else {
        query = query.eq("status", statusFilter);
      }
    }

    if (search) {
      const { data: userIds } = await supabase
        .from("users")
        .select("id")
        .ilike("full_name", `%${search}%`);

      if (userIds && userIds.length > 0) {
        query = query.in(
          "user_id",
          userIds.map((u) => u.id)
        );
      } else {
        query = query.eq("user_id", "00000000-0000-0000-0000-000000000000");
      }
    }

    let { data } = await query;

    if (statusFilter === "overdue" && data) {
      data = (data as BorrowRequest[]).filter((r) => isPastDue(r));
    }

    if (data) {
      setRequests(data as BorrowRequest[]);
    } else {
      setRequests([]);
    }

    const { count: total } = await supabase
      .from("borrow_requests")
      .select("*", { count: "exact", head: true });

    const { count: pending } = await supabase
      .from("borrow_requests")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");

    const { count: active } = await supabase
      .from("borrow_requests")
      .select("*", { count: "exact", head: true })
      .in("status", ["approved", "borrowed"]);

    const { count: returned } = await supabase
      .from("borrow_requests")
      .select("*", { count: "exact", head: true })
      .eq("status", "returned");

    setStats({
      total: total || 0,
      pending: pending || 0,
      active: active || 0,
      returned: returned || 0,
    });

    setLoading(false);
  }, [activeTab, statusFilter, search]);

  useEffect(() => {
    void (async () => {
      await fetchData();
    })();
  }, [fetchData]);

  useEffect(() => {
    const channel = supabase
      .channel('admin-borrow-requests')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'borrow_requests' }, () => fetchData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleApprove = (id: string) => {
    withConfirm(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase
        .from("borrow_requests")
        .update({
          status: "approved",
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
        })
        .eq("id", id);
      const borrowRequest = requests.find((r) => r.id === id);
      const equipmentName = borrowRequest ? getEquipmentName(borrowRequest) : "Unknown equipment";
      const totalQty = borrowRequest?.borrow_items?.reduce((sum, bi) => sum + bi.quantity, 0) || 0;
      const studentName = borrowRequest?.users?.full_name || "Student";
      logActivity(undefined, "approve", "borrow_request", id, { status: "approved" });
      if (borrowRequest) {
        // Notify student
        const studentMsg = studentNotifications.borrowApproved(totalQty, equipmentName);
        await createNotification(
          borrowRequest.user_id,
          studentMsg.title,
          studentMsg.message,
          "borrow_status",
          "borrow_request",
          id
        );
        // Notify admin (if approved by faculty)
        if (borrowRequest.request_type === "student") {
          const adminMsg = adminNotifications.borrowApproved(studentName, totalQty, equipmentName);
          await notifyRole("admin", adminMsg.title, adminMsg.message, "borrow_status", "borrow_request", id);
          // Notify faculty
          await notifyRole("faculty", adminMsg.title, adminMsg.message, "borrow_status", "borrow_request", id);
        }
      }
      fetchData();
    });
  };

  const handleReject = async () => {
    if (!selectedRequest) return;
    await supabase
      .from("borrow_requests")
      .update({
        status: "denied",
        denied_reason: rejectReason,
      })
      .eq("id", selectedRequest.id);
    const equipmentName = getEquipmentName(selectedRequest);
    const totalQty = selectedRequest.borrow_items?.reduce((sum, bi) => sum + bi.quantity, 0) || 0;
    const studentName = selectedRequest.users?.full_name || "Student";
    logActivity(undefined, "reject", "borrow_request", selectedRequest.id, { status: "denied", reason: rejectReason });
    // Notify student
    const studentMsg = studentNotifications.borrowRejected(totalQty, equipmentName);
    await createNotification(
      selectedRequest.user_id,
      studentMsg.title,
      studentMsg.message,
      "borrow_status",
      "borrow_request",
      selectedRequest.id
    );
    // Notify admin
    const adminMsg = adminNotifications.borrowRejected(studentName, totalQty, equipmentName);
    await notifyRole("admin", adminMsg.title, adminMsg.message, "borrow_status", "borrow_request", selectedRequest.id);
    // Notify faculty
    await notifyRole("faculty", adminMsg.title, adminMsg.message, "borrow_status", "borrow_request", selectedRequest.id);
    setRejectOpen(false);
    setRejectReason("");
    setSelectedRequest(null);
    fetchData();
  };

  const openView = (req: BorrowRequest) => {
    setSelectedRequest(req);
    setViewOpen(true);
  };

  const openReject = (req: BorrowRequest) => {
    setSelectedRequest(req);
    setRejectReason("");
    setRejectOpen(true);
  };

  const openReturn = (req: BorrowRequest) => {
    setSelectedRequest(req);
    const items: ReturnItemForm[] = (req.borrow_items || []).map((bi) => {
      const remaining = bi.quantity - bi.returned_quantity;
      return {
        borrowItemId: bi.id,
        equipmentName: bi.equipment?.name || "Unknown",
        quantityBorrowed: bi.quantity,
        alreadyReturned: bi.returned_quantity,
        returningQuantity: remaining > 0 ? remaining : 0,
        condition: "good" as const,
      };
    });
    setReturnItems(items);
    setReturnOpen(true);
  };

  const updateReturnItem = (index: number, field: keyof ReturnItemForm, value: string | number) => {
    setReturnItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const handleReturn = async () => {
    if (!selectedRequest) return;

    let allReturned = true;
    let hasDamage = false;

    for (const item of returnItems) {
      const newReturnedQty = item.alreadyReturned + item.returningQuantity;
      const fullyReturned = newReturnedQty >= item.quantityBorrowed;
      const equipmentId = (selectedRequest.borrow_items || []).find((bi) => bi.id === item.borrowItemId)?.equipment_id;

      await supabase
        .from("borrow_items")
        .update({
          returned_quantity: newReturnedQty,
          condition_on_return: item.condition,
        })
        .eq("id", item.borrowItemId);

      if (!fullyReturned) allReturned = false;

      if (item.condition === "damaged" || item.condition === "lost") {
        hasDamage = true;
        if (equipmentId) {
          await supabase.from("equipment").update({ status: "damaged" }).eq("id", equipmentId);
        }
        const { data: damageReport } = await supabase.from("damage_reports").insert({
          user_id: selectedRequest.user_id,
          equipment_id: equipmentId,
          borrow_request_id: selectedRequest.id,
          description: `Condition on return: ${item.condition}`,
          severity: item.condition === "lost" ? "critical" : "minor",
          status: "pending",
        }).select("id, severity, equipment_id").single();
        if (damageReport) {
          logActivity(undefined, "damage_report", "damage_report", damageReport.id, { severity: damageReport.severity, equipment_id: damageReport.equipment_id });
        }
      }
    }

    if (hasDamage) {
      await supabase
        .from("borrow_requests")
        .update({
          status: "damaged",
          actual_return_date: new Date().toISOString(),
        })
        .eq("id", selectedRequest.id);
      const summary = returnItems
        .filter((item) => item.condition === "damaged" || item.condition === "lost")
        .map((item) => `${item.returningQuantity}x ${item.equipmentName}`)
        .join(", ");
      const studentName = selectedRequest.users?.full_name || "Student";
      logActivity(undefined, "damage_report", "borrow_request", selectedRequest.id, { status: "damaged" });
      const damagedMsg = adminNotifications.equipmentDamaged(summary, studentName);
      await notifyRole("admin", damagedMsg.title, damagedMsg.message, "damage_report", "borrow_request", selectedRequest.id);
      await notifyRole("faculty", damagedMsg.title, damagedMsg.message, "damage_report", "borrow_request", selectedRequest.id);
      const studentDamagedMsg = studentNotifications.equipmentDamaged(summary);
      await createNotification(
        selectedRequest.user_id,
        studentDamagedMsg.title,
        studentDamagedMsg.message,
        "damage_report",
        "borrow_request",
        selectedRequest.id
      );
    } else if (allReturned) {
      await supabase
        .from("borrow_requests")
        .update({
          status: "returned",
          actual_return_date: new Date().toISOString(),
        })
        .eq("id", selectedRequest.id);
      const equipmentName = getEquipmentName(selectedRequest);
      const totalQty = selectedRequest.borrow_items?.reduce((sum, bi) => sum + bi.quantity, 0) || 0;
      const studentName = selectedRequest.users?.full_name || "Student";
      logActivity(undefined, "return", "borrow_request", selectedRequest.id, { status: "returned" });
      // Notify student
      const studentMsg = studentNotifications.equipmentReturned(totalQty, equipmentName);
      await createNotification(
        selectedRequest.user_id,
        studentMsg.title,
        studentMsg.message,
        "borrow_status",
        "borrow_request",
        selectedRequest.id
      );
      // Notify admin
      const adminMsg = adminNotifications.equipmentReturned(studentName, totalQty, equipmentName);
      await notifyRole("admin", adminMsg.title, adminMsg.message, "borrow_status", "borrow_request", selectedRequest.id);
      // Notify faculty
      await notifyRole("faculty", adminMsg.title, adminMsg.message, "borrow_status", "borrow_request", selectedRequest.id);
    } else if (selectedRequest.status === "approved") {
      await supabase
        .from("borrow_requests")
        .update({ status: "borrowed" })
        .eq("id", selectedRequest.id);
    }

    setReturnOpen(false);
    setSelectedRequest(null);
    setReturnItems([]);
    fetchData();
  };

  const openDamageReport = (req: BorrowRequest) => {
    setSelectedRequest(req);
    const allItems = req.borrow_items || [];
    const damaged = allItems.filter(
      (bi) => bi.condition_on_return === "damaged" || bi.condition_on_return === "lost"
    );
    const chosen =
      damaged.length > 0
        ? damaged
        : allItems.filter((bi) => bi.quantity - bi.returned_quantity > 0);
    const items: DamageItemInfo[] = chosen.map((bi) => ({
      borrowItemId: bi.id,
      equipmentId: bi.equipment_id,
      equipmentName: bi.equipment?.name || "Unknown",
      condition: bi.condition_on_return || "damaged",
      damageType: "minor_damage",
    }));
    setDamageItems(items);
    setDamageDescription("");
    setDamageOpen(true);
  };

  const updateDamageItem = (index: number, field: keyof DamageItemInfo, value: string) => {
    setDamageItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const handleDamageSubmit = async () => {
    if (!selectedRequest || !damageDescription.trim()) return;

    for (const item of damageItems) {
      const severity = DAMAGE_TYPE_TO_SEVERITY[item.damageType] || "minor";
      const { data: report } = await supabase.from("damage_reports").insert({
        user_id: selectedRequest.user_id,
        equipment_id: (selectedRequest.borrow_items || []).find((bi) => bi.id === item.borrowItemId)?.equipment_id,
        borrow_request_id: selectedRequest.id,
        description: damageDescription,
        damage_type: item.damageType,
        severity,
        status: "pending",
      }).select("id").single();
      if (report) {
        logActivity(undefined, "damage_report", "damage_report", report.id, { damage_type: item.damageType, severity, equipment_id: item.equipmentId });
        // Notify admin
        const summary = damageItems.map((di) => di.equipmentName).join(", ");
        const studentName = selectedRequest.users?.full_name || "Student";
        const adminMsg = adminNotifications.equipmentDamaged(summary, studentName);
        await notifyRole("admin", adminMsg.title, adminMsg.message, "damage_report", "damage_report", report.id);
        // Notify student
        const studentMsg = studentNotifications.equipmentDamaged(summary);
        await createNotification(
          selectedRequest.user_id,
          studentMsg.title,
          studentMsg.message,
          "damage_report",
          "damage_report",
          report.id
        );
        // Notify faculty
        await notifyRole("faculty", adminMsg.title, adminMsg.message, "damage_report", "damage_report", report.id);
      }
    }

    if (damageItems.length > 0) {
      await supabase
        .from("borrow_requests")
        .update({ status: "damaged" })
        .eq("id", selectedRequest.id);
      for (const item of damageItems) {
        await supabase
          .from("equipment")
          .update({ status: "damaged" })
          .eq("id", item.equipmentId);
      }
    }

    setDamageOpen(false);
    setDamageItems([]);
    setDamageDescription("");
    setSelectedRequest(null);
    fetchData();
  };

  const getTypeBadge = (type: string) => {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase ${
          type === "student"
            ? "bg-purple-100 text-purple-700"
            : "bg-sky-100 text-sky-700"
        }`}
      >
        {type === "student" ? (
          <GraduationCap className="h-3 w-3" />
        ) : (
          <Users className="h-3 w-3" />
        )}
        {type}
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

  const getStatusBadge = (req: BorrowRequest) => {
    const status = req.status;
    if (isPastDue(req)) {
      return (
        <span className="inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase bg-red-100 text-red-700">
          Overdue
        </span>
      );
    }
    const config = STATUS_VARIANTS[status] || STATUS_VARIANTS.pending;
    return (
      <span
        className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase ${config.className}`}
      >
        {config.label}
      </span>
    );
  };

  const overdueCount = requests.filter((req) => isPastDue(req)).length;

  return (
    <>
      <div>
        {overdueCount > 0 && (
          <div className="mb-4 flex items-center gap-3 rounded-xl border-2 border-red-400 bg-red-50 px-5 py-3 text-red-800">
            <AlertTriangle className="h-5 w-5 flex-shrink-0 text-red-600" />
            <span className="text-sm font-semibold">
              {overdueCount} overdue {overdueCount === 1 ? "borrow" : "borrows"} need attention
            </span>
          </div>
        )}

        <div className="mb-6 rounded-xl border border-[#dde4ec] bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-xl font-bold text-navy">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-light text-teal">
                  <HandHelping className="h-4 w-4" />
                </span>
                Borrow Requests
              </h2>
            </div>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Total Requests", value: stats.total, icon: PackageCheck, color: "#3b82f6" },
            { label: "Pending", value: stats.pending, icon: Clock, color: "#f59e0b" },
            { label: "Active Borrows", value: stats.active, icon: HandHelping, color: "#6366f1" },
            { label: "Returned", value: stats.returned, icon: CheckCheck, color: "#10b981" },
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
          {[
            { value: "all" as RequestType, label: "All Requests" },
            { value: "student" as RequestType, label: "Student Borrowings" },
            { value: "faculty" as RequestType, label: "Faculty Borrowings" },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`rounded-lg border px-4 py-2 text-sm font-semibold transition-all ${
                activeTab === tab.value
                  ? "border-teal bg-teal text-white"
                  : "border-[#dde4ec] bg-white text-silver hover:border-teal hover:text-teal"
              }`}
            >
              {tab.label}
            </button>
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

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-silver" />
          <Input
            placeholder="Search by requester name..."
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
                  <th className="px-4 py-3">Requester</th>
                  <th className="px-4 py-3">Type</th>
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
                      <td className="px-4 py-3">
                        <Skeleton className="h-4 w-32" />
                      </td>
                      <td className="px-4 py-3">
                        <Skeleton className="h-5 w-16 rounded-full" />
                      </td>
                      <td className="px-4 py-3">
                        <Skeleton className="h-4 w-40" />
                      </td>
                      <td className="px-4 py-3">
                        <Skeleton className="h-4 w-20" />
                      </td>
                      <td className="px-4 py-3">
                        <Skeleton className="h-4 w-20" />
                      </td>
                      <td className="px-4 py-3">
                        <Skeleton className="h-5 w-20 rounded-full" />
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
                ) : requests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-silver">
                      No borrow requests found
                    </td>
                  </tr>
                ) : (
                  requests.map((req) => {
                    return (
                      <tr
                        key={req.id}
                        className={`border-b border-[#f0f0f0] ${
                          req.status === "return_requested"
                            ? "bg-teal-50 ring-2 ring-inset ring-teal-400/60"
                            : "hover:bg-[#f8f9fa]"
                        }`}
                      >
                        <td className="px-4 py-3 font-medium text-navy">
                          {req.users?.full_name || "Unknown"}
                        </td>
                        <td className="px-4 py-3">{getTypeBadge(req.request_type)}</td>
                        <td className="px-4 py-3 text-silver">
                          {req.borrow_items && req.borrow_items.length > 0
                            ? req.borrow_items
                                .map(
                                  (bi) =>
                                    `${bi.quantity}\u00d7 ${bi.equipment?.name || "Unknown"}`
                                )
                                .join(", ")
                            : "-"}
                        </td>
                        <td className="px-4 py-3 text-silver">
                          {formatDate(req.borrow_date)}
                        </td>
                        <td className="px-4 py-3 text-silver">
                          {formatDate(req.return_date)}
                        </td>
                        <td className="px-4 py-3">{getStatusBadge(req)}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openView(req)}
                              className="h-8 w-8 p-0"
                            >
                              <Eye className="h-3.5 w-3.5 text-slate" />
                            </Button>
                            {req.status === "pending" && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleApprove(req.id)}
                                  className="h-8 w-8 p-0"
                                >
                                  <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openReject(req)}
                                  className="h-8 w-8 p-0"
                                >
                                  <XCircle className="h-3.5 w-3.5 text-red-400" />
                                </Button>
                              </>
                            )}
                            {canReturnOrDamage(req) && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openReturn(req)}
                                  className="h-8 w-8 p-0"
                                  title="Mark as Returned"
                                >
                                  <RotateCcw className="h-3.5 w-3.5 text-teal" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openDamageReport(req)}
                                  className="h-8 w-8 p-0"
                                  title="Report Damage"
                                >
                                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
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
              <DialogTitle className="text-navy">Borrow Request Details</DialogTitle>
              <DialogDescription className="text-silver">
                Request ID: <span className="font-mono text-xs">{selectedRequest?.id.slice(0, 8)}</span>
              </DialogDescription>
            </DialogHeader>

            {selectedRequest && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs font-medium uppercase text-silver">Requester</p>
                    <p className="mt-0.5 font-medium text-navy">
                      {selectedRequest.users?.full_name || "Unknown"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase text-silver">Type</p>
                    <p className="mt-0.5">{getTypeBadge(selectedRequest.request_type)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase text-silver">Borrow Date</p>
                    <p className="mt-0.5 text-navy">
                      {formatDate(selectedRequest.borrow_date)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase text-silver">Return Date</p>
                    <p className="mt-0.5 text-navy">
                      {formatDate(selectedRequest.return_date)}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs font-medium uppercase text-silver">Status</p>
                    <p className="mt-1">{getStatusBadge(selectedRequest)}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs font-medium uppercase text-silver">Purpose</p>
                    <p className="mt-0.5 text-navy">
                      {selectedRequest.purpose || "-"}
                    </p>
                  </div>
                  {selectedRequest.notes && (
                    <div className="col-span-2">
                      <p className="text-xs font-medium uppercase text-silver">Notes</p>
                      <p className="mt-0.5 text-navy">{selectedRequest.notes}</p>
                    </div>
                  )}
                  {selectedRequest.denied_reason && (
                    <div className="col-span-2">
                      <p className="text-xs font-medium uppercase text-silver">Denied Reason</p>
                      <p className="mt-0.5 text-red-600">{selectedRequest.denied_reason}</p>
                    </div>
                  )}
                  {selectedRequest.approved_at && (
                    <div className="col-span-2">
                      <p className="text-xs font-medium uppercase text-silver">Approved At</p>
                      <p className="mt-0.5 text-navy">
                        {new Date(selectedRequest.approved_at).toLocaleString()}
                      </p>
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
                              <td className="px-3 py-2 font-medium text-navy">
                                {bi.equipment?.name || "Unknown"}
                              </td>
                              <td className="px-3 py-2 text-center">{bi.quantity}</td>
                              <td className="px-3 py-2 text-center">{bi.returned_quantity}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-navy">Reject Borrow Request</DialogTitle>
              <DialogDescription className="text-silver">
                Provide a reason for denying this request.
              </DialogDescription>
            </DialogHeader>

            <div>
              <label className="text-xs font-medium text-slate">Reason *</label>
              <Input
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter reason for denial..."
                className="mt-1 border-[#dde4ec]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setRejectOpen(false);
                  setSelectedRequest(null);
                  setRejectReason("");
                }}
                className="border-[#dde4ec]"
              >
                Cancel
              </Button>
              <Button
                onClick={handleReject}
                disabled={!rejectReason.trim()}
                className="bg-red-500 hover:bg-red-600"
              >
                Reject
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={returnOpen} onOpenChange={setReturnOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-navy">Mark Items as Returned</DialogTitle>
              <DialogDescription className="text-silver">
                Record returned items and their condition.
              </DialogDescription>
            </DialogHeader>

            {returnItems.length > 0 && (
              <div className="space-y-4">
                {returnItems.map((item, index) => (
                  <div
                    key={item.borrowItemId}
                    className="rounded-lg border border-[#dde4ec] p-3"
                  >
                    <p className="mb-2 text-sm font-semibold text-navy">
                      {item.equipmentName}
                    </p>
                    <p className="mb-2 text-xs text-silver">
                      Borrowed: {item.quantityBorrowed} &middot; Already returned: {item.alreadyReturned}
                    </p>

                    <div className="mb-3">
                      <Label className="text-xs font-medium text-slate">
                        Quantity Returning
                      </Label>
                      <Input
                        type="number"
                        min={0}
                        max={item.quantityBorrowed - item.alreadyReturned}
                        value={item.returningQuantity}
                        onChange={(e) =>
                          updateReturnItem(
                            index,
                            "returningQuantity",
                            Math.max(0, parseInt(e.target.value) || 0)
                          )
                        }
                        className="mt-1 border-[#dde4ec]"
                      />
                    </div>

                    <div>
                      <Label className="text-xs font-medium text-slate">
                        Condition on Return
                      </Label>
                      <Select
                        value={item.condition}
                        onValueChange={(value) =>
                          updateReturnItem(index, "condition", value || "good")
                        }
                      >
                        <SelectTrigger className="mt-1 w-full border-[#dde4ec]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="good">Good</SelectItem>
                          <SelectItem value="damaged">Damaged</SelectItem>
                          <SelectItem value="lost">Lost</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setReturnOpen(false);
                  setSelectedRequest(null);
                  setReturnItems([]);
                }}
                className="border-[#dde4ec]"
              >
                Cancel
              </Button>
              <Button
                onClick={handleReturn}
                disabled={returnItems.every((item) => item.returningQuantity <= 0)}
                className="bg-teal hover:bg-teal/90"
              >
                Confirm Return
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={damageOpen} onOpenChange={setDamageOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-navy">Report Damage</DialogTitle>
              <DialogDescription className="text-silver">
                Submit a damage report for the affected equipment.
              </DialogDescription>
            </DialogHeader>

            {damageItems.length > 0 && (
              <div className="space-y-4">
                <div>
                  <p className="mb-1 text-xs font-medium uppercase text-silver">
                    Affected Equipment
                  </p>
                  <div className="space-y-3">
                    {damageItems.map((item, index) => (
                      <div
                        key={item.borrowItemId}
                        className="rounded-lg border border-[#dde4ec] p-3"
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <span className="font-medium text-navy">{item.equipmentName}</span>
                          <Badge
                            className={
                              item.condition === "lost"
                                ? "bg-red-100 text-red-700"
                                : "bg-amber-100 text-amber-700"
                            }
                          >
                            {item.condition}
                          </Badge>
                        </div>
                        <div>
                          <Label className="text-xs font-medium text-slate">
                            Select Damage Type
                          </Label>
                          <Select
                            value={item.damageType}
                            onValueChange={(value) =>
                              updateDamageItem(index, "damageType", value || "minor_damage")
                            }
                          >
                            <SelectTrigger className="mt-1 w-full border-[#dde4ec]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {DAMAGE_TYPES.map((t) => (
                                <SelectItem key={t.value} value={t.value}>
                                  {t.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-medium text-slate">
                    Description *
                  </Label>
                  <Textarea
                    value={damageDescription}
                    onChange={(e) => setDamageDescription(e.target.value)}
                    placeholder="Describe the damage..."
                    rows={3}
                    className="mt-1 border-[#dde4ec]"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setDamageOpen(false);
                  setDamageItems([]);
                  setDamageDescription("");
                  setSelectedRequest(null);
                }}
                className="border-[#dde4ec]"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDamageSubmit}
                disabled={!damageDescription.trim()}
                className="bg-red-500 hover:bg-red-600"
              >
                Submit Report
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Approve Request?"
        description="Are you sure you want to approve this borrow request?"
        confirmLabel="Approve"
        variant="danger"
        onConfirm={() => { confirmAction?.(); setConfirmOpen(false); }}
      />
    </>
  );
}
