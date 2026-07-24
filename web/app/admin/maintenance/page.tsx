"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
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
} from "@/components/ui/dialog";
import {
  Plus,
  Search,
  Wrench,
  CheckCircle,
  Play,
  Pencil,
  Trash2,
  Calendar,
  Table,
  AlertTriangle,
  Clock,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface Equipment {
  id: string;
  name: string;
}

interface Maintenance {
  id: string;
  equipment_id: string;
  description: string;
  scheduled_date: string;
  completed_date: string | null;
  status: "scheduled" | "in_progress" | "completed";
  notes: string | null;
  created_by: string;
  created_at: string;
  equipment?: Equipment;
}

type StatusFilter = "all" | "scheduled" | "in_progress" | "completed";
type ViewMode = "table" | "calendar";

const STATUS_VARIANTS: Record<string, { label: string; className: string }> = {
  scheduled: { label: "Scheduled", className: "bg-amber-100 text-amber-700" },
  in_progress: { label: "In Progress", className: "bg-blue-100 text-blue-700" },
  completed: { label: "Completed", className: "bg-green-100 text-green-700" },
};

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "scheduled", label: "Scheduled" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
];

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function MaintenancePage() {
  const supabase = createClient();

  const [view, setView] = useState<ViewMode>("table");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [records, setRecords] = useState<Maintenance[]>([]);
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, scheduled: 0, inProgress: 0, completed: 0 });

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    equipment_id: "",
    description: "",
    scheduled_date: "",
    notes: "",
  });

  const [calendarDate, setCalendarDate] = useState(new Date());
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);

    let query = supabase
      .from("maintenance")
      .select("*, equipment(id, name)")
      .order("scheduled_date", { ascending: false });

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    if (search) {
      const { data: eqData } = await supabase
        .from("equipment")
        .select("id")
        .ilike("name", `%${search}%`);

      if (eqData && eqData.length > 0) {
        query = query.in("equipment_id", eqData.map((e) => e.id));
      } else {
        query = query.or(
          `description.ilike.%${search}%,notes.ilike.%${search}%`
        );
      }
    }

    const { data } = await query;
    setRecords((data as Maintenance[]) || []);

    const { count: total } = await supabase
      .from("maintenance")
      .select("*", { count: "exact", head: true });
    const { count: scheduled } = await supabase
      .from("maintenance")
      .select("*", { count: "exact", head: true })
      .eq("status", "scheduled");
    const { count: inProgress } = await supabase
      .from("maintenance")
      .select("*", { count: "exact", head: true })
      .eq("status", "in_progress");
    const { count: completed } = await supabase
      .from("maintenance")
      .select("*", { count: "exact", head: true })
      .eq("status", "completed");

    setStats({
      total: total || 0,
      scheduled: scheduled || 0,
      inProgress: inProgress || 0,
      completed: completed || 0,
    });

    setLoading(false);
  }, [statusFilter, search]);

  const fetchEquipment = async () => {
    const { data } = await supabase
      .from("equipment")
      .select("id, name")
      .order("name");
    if (data) setEquipmentList(data);
  };

  useEffect(() => {
    fetchEquipment();
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openCreate = () => {
    setEditingId(null);
    setForm({ equipment_id: "", description: "", scheduled_date: "", notes: "" });
    setModalOpen(true);
  };

  const openEdit = (m: Maintenance) => {
    setEditingId(m.id);
    setForm({
      equipment_id: m.equipment_id || "",
      description: m.description || "",
      scheduled_date: m.scheduled_date || "",
      notes: m.notes || "",
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    const payload = {
      equipment_id: form.equipment_id || null,
      description: form.description,
      scheduled_date: form.scheduled_date || null,
      notes: form.notes || null,
    };

    if (editingId) {
      await supabase.from("maintenance").update(payload).eq("id", editingId);
    } else {
      await supabase.from("maintenance").insert({ ...payload, status: "scheduled" });
    }
    setModalOpen(false);
    fetchData();
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    await supabase.from("maintenance").delete().eq("id", deleteConfirm);
    setDeleteConfirm(null);
    fetchData();
  };

  const handleMarkInProgress = async (id: string) => {
    await supabase
      .from("maintenance")
      .update({ status: "in_progress" })
      .eq("id", id);
    fetchData();
  };

  const handleMarkCompleted = async (id: string) => {
    await supabase
      .from("maintenance")
      .update({
        status: "completed",
        completed_date: new Date().toISOString().split("T")[0],
      })
      .eq("id", id);
    fetchData();
  };

  const getStatusBadge = (status: string) => {
    const config = STATUS_VARIANTS[status] || STATUS_VARIANTS.scheduled;
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

  const changeMonth = (delta: number) => {
    setCalendarDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  };

  const getCalendarDays = () => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);

    return days;
  };

  const getMaintenanceDotsForDay = (day: number) => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return records.filter((r) => r.scheduled_date === dateStr);
  };

  return (
    <div>
      <div className="mb-6 rounded-xl border border-[#dde4ec] bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-bold text-navy">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-light text-teal">
                <Wrench className="h-4 w-4" />
              </span>
              Maintenance
            </h2>
          </div>
          <div className="flex gap-2">
            <div className="flex rounded-lg border border-[#dde4ec] bg-[#f8f9fa] p-0.5">
              <button
                onClick={() => setView("table")}
                className={`flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                  view === "table"
                    ? "bg-white text-navy shadow-sm"
                    : "text-silver hover:text-navy"
                }`}
              >
                <Table className="h-3.5 w-3.5" /> Table
              </button>
              <button
                onClick={() => setView("calendar")}
                className={`flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                  view === "calendar"
                    ? "bg-white text-navy shadow-sm"
                    : "text-silver hover:text-navy"
                }`}
              >
                <Calendar className="h-3.5 w-3.5" /> Calendar
              </button>
            </div>
            <Button
              size="sm"
              onClick={openCreate}
              className="gap-1.5 bg-teal hover:bg-teal-dark"
            >
              <Plus className="h-3.5 w-3.5" /> Schedule Maintenance
            </Button>
          </div>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total", value: stats.total, icon: Wrench, color: "#3b82f6" },
          { label: "Scheduled", value: stats.scheduled, icon: Calendar, color: "#f59e0b" },
          { label: "In Progress", value: stats.inProgress, icon: Play, color: "#6366f1" },
          { label: "Completed", value: stats.completed, icon: CheckCheck, color: "#10b981" },
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

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-silver" />
        <Input
          placeholder="Search by equipment name or description..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md border-[#dde4ec] pl-10"
        />
      </div>

      {view === "table" ? (
        <div className="ecp-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#dde4ec] bg-[#f8f9fa] text-xs font-semibold uppercase tracking-wider text-silver">
                  <th className="px-4 py-3">Equipment</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Scheduled Date</th>
                  <th className="px-4 py-3">Completed Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-[#f0f0f0]">
                      <td className="px-4 py-3">
                        <Skeleton className="h-4 w-36" />
                      </td>
                      <td className="px-4 py-3">
                        <Skeleton className="h-4 w-48" />
                      </td>
                      <td className="px-4 py-3">
                        <Skeleton className="h-4 w-24" />
                      </td>
                      <td className="px-4 py-3">
                        <Skeleton className="h-4 w-24" />
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
                ) : records.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-silver">
                      No maintenance records found
                    </td>
                  </tr>
                ) : (
                  records.map((m) => (
                    <tr key={m.id} className="border-b border-[#f0f0f0] hover:bg-[#f8f9fa]">
                      <td className="px-4 py-3 font-medium text-navy">
                        {m.equipment?.name || "Unknown"}
                      </td>
                      <td className="px-4 py-3 text-silver">
                        {m.description || "-"}
                      </td>
                      <td className="px-4 py-3 text-silver">
                        {formatDate(m.scheduled_date)}
                      </td>
                      <td className="px-4 py-3 text-silver">
                        {formatDate(m.completed_date)}
                      </td>
                      <td className="px-4 py-3">{getStatusBadge(m.status)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          {m.status === "scheduled" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMarkInProgress(m.id)}
                              className="h-8 w-8 p-0"
                              title="Mark In Progress"
                            >
                              <Play className="h-3.5 w-3.5 text-blue-500" />
                            </Button>
                          )}
                          {(m.status === "scheduled" || m.status === "in_progress") && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMarkCompleted(m.id)}
                              className="h-8 w-8 p-0"
                              title="Mark Completed"
                            >
                              <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(m)}
                            className="h-8 w-8 p-0"
                          >
                            <Pencil className="h-3.5 w-3.5 text-slate" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteConfirm(m.id)}
                            className="h-8 w-8 p-0"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-red-400" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="ecp-card p-4">
          <div className="mb-4 flex items-center justify-between">
            <button
              onClick={() => changeMonth(-1)}
              className="rounded-lg p-1.5 text-silver hover:bg-[#f8f9fa] hover:text-navy"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h3 className="text-lg font-bold text-navy">
              {MONTHS[calendarDate.getMonth()]} {calendarDate.getFullYear()}
            </h3>
            <button
              onClick={() => changeMonth(1)}
              className="rounded-lg p-1.5 text-silver hover:bg-[#f8f9fa] hover:text-navy"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-0.5">
            {DAYS_OF_WEEK.map((d) => (
              <div
                key={d}
                className="px-1 py-1.5 text-center text-[11px] font-semibold uppercase text-silver"
              >
                {d}
              </div>
            ))}
            {getCalendarDays().map((day, i) => {
              const dots = day ? getMaintenanceDotsForDay(day) : [];
              const hasScheduled = dots.some((d) => d.status === "scheduled");
              const hasInProgress = dots.some((d) => d.status === "in_progress");
              const hasCompleted = dots.some((d) => d.status === "completed");

              return (
                <div
                  key={i}
                  className={`flex min-h-[60px] flex-col rounded-lg border p-1 ${
                    day
                      ? "border-[#f0f0f0] hover:bg-[#f8f9fa]"
                      : "border-transparent"
                  }`}
                >
                  {day && (
                    <>
                      <span className="text-xs font-medium text-navy">{day}</span>
                      <div className="mt-0.5 flex flex-wrap gap-0.5">
                        {hasScheduled && (
                          <span
                            className="h-1.5 w-1.5 rounded-full bg-amber-400"
                            title="Scheduled"
                          />
                        )}
                        {hasInProgress && (
                          <span
                            className="h-1.5 w-1.5 rounded-full bg-blue-400"
                            title="In Progress"
                          />
                        )}
                        {hasCompleted && (
                          <span
                            className="h-1.5 w-1.5 rounded-full bg-green-400"
                            title="Completed"
                          />
                        )}
                      </div>
                      {dots.length > 0 && (
                        <p className="mt-0.5 text-[10px] text-silver leading-tight line-clamp-1">
                          {dots.length} event{dots.length > 1 ? "s" : ""}
                        </p>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {loading ? (
            <div className="mt-4 space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
          ) : (
            <div className="mt-4 flex items-center gap-4 text-xs text-silver">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-400" /> Scheduled
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-blue-400" /> In Progress
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-green-400" /> Completed
              </span>
            </div>
          )}
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-navy">
              {editingId ? "Edit Maintenance" : "Schedule Maintenance"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-slate">Equipment *</label>
              <Select
                value={form.equipment_id}
                onValueChange={(v) => setForm({ ...form, equipment_id: v || "" })}
              >
                <SelectTrigger className="mt-1 w-full border-[#dde4ec]">
                  <SelectValue placeholder="Select equipment..." />
                </SelectTrigger>
                <SelectContent>
                  {equipmentList.map((eq) => (
                    <SelectItem key={eq.id} value={eq.id}>
                      {eq.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate">Description</label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Describe the maintenance task..."
                rows={3}
                className="mt-1 border-[#dde4ec]"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate">
                Scheduled Date
              </label>
              <Input
                type="date"
                value={form.scheduled_date}
                onChange={(e) =>
                  setForm({ ...form, scheduled_date: e.target.value })
                }
                className="mt-1 border-[#dde4ec]"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate">Notes</label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Additional notes..."
                rows={2}
                className="mt-1 border-[#dde4ec]"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setModalOpen(false)}
              className="border-[#dde4ec]"
            >
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-teal hover:bg-teal/90">
              {editingId ? "Update" : "Schedule"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!deleteConfirm}
        onOpenChange={() => setDeleteConfirm(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-navy">Delete Maintenance</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-silver">
            Are you sure you want to delete this maintenance record? This action
            cannot be undone.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setDeleteConfirm(null)}
              className="border-[#dde4ec]"
            >
              Cancel
            </Button>
            <Button onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
