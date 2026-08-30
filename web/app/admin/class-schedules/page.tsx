"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/components/shared/toast";
import { logActivity } from "@/lib/logger";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
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
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  CalendarClock,
  Clock,
  Users,
} from "lucide-react";

interface Faculty {
  id: string;
  full_name: string;
}

interface ClassSchedule {
  id: string;
  faculty_id: string;
  faculty_name: string;
  subject: string;
  section: string | null;
  day_of_week: string;
  start_time: string | null;
  end_time: string | null;
  room: string | null;
  semester: string | null;
  school_year: string | null;
  created_at: string;
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function ClassSchedulesPage() {
  const supabase = createClient();

  const [schedules, setSchedules] = useState<ClassSchedule[]>([]);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dayFilter, setDayFilter] = useState("all");
  const [stats, setStats] = useState({ total: 0, faculty: 0, today: 0 });

  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingLabel, setDeletingLabel] = useState("");

  const [form, setForm] = useState({
    faculty_id: "",
    subject: "",
    section: "",
    day_of_week: "",
    start_time: "",
    end_time: "",
    room: "",
    semester: "",
    school_year: "",
  });

  useEffect(() => {
    supabase
      .from("users")
      .select("id, full_name")
      .eq("role", "faculty")
      .order("full_name")
      .then(({ data }) => {
        if (data) setFaculty(data as Faculty[]);
      });
  }, [supabase]);

  const fetchData = useCallback(async () => {
    setLoading(true);

    const { count: total } = await supabase
      .from("class_schedules")
      .select("*", { count: "exact", head: true });

    const { data: facultyData } = await supabase
      .from("class_schedules")
      .select("faculty_id");

    const uniqueFaculty = new Set<string>();
    if (facultyData) facultyData.forEach((s) => uniqueFaculty.add(s.faculty_id));

    const now = new Date();
    const dayIndex = now.getDay();
    const dayNames = ["Sunday", ...DAYS];
    const todayName = dayNames[dayIndex === 0 ? 7 : dayIndex];

    const { count: today } = await supabase
      .from("class_schedules")
      .select("*", { count: "exact", head: true })
      .eq("day_of_week", todayName);

    setStats({
      total: total || 0,
      faculty: uniqueFaculty.size,
      today: today || 0,
    });

    let query = supabase
      .from("class_schedules")
      .select("*, users!inner(full_name)")
      .order("day_of_week")
      .order("start_time");

    if (dayFilter !== "all") {
      query = query.eq("day_of_week", dayFilter);
    }
    if (search) {
      query = query.or(
        `subject.ilike.%${search}%,section.ilike.%${search}%`
      );
    }

    const { data } = await query;

    if (data) {
      const mapped: ClassSchedule[] = data.map((row: Record<string, unknown>) => {
        const users = row.users as Record<string, unknown> | Record<string, unknown>[];
        const facultyName = !Array.isArray(users) && users?.full_name
          ? String(users.full_name)
          : "";
        return {
          ...(row as unknown as ClassSchedule),
          faculty_name: facultyName,
        };
      });
      setSchedules(mapped);
    }
    setLoading(false);
  }, [supabase, dayFilter, search]);

  useEffect(() => {
    void (async () => {
      await fetchData();
    })();
  }, [fetchData]);

  const openCreate = () => {
    setEditingId(null);
    setForm({
      faculty_id: "",
      subject: "",
      section: "",
      day_of_week: "",
      start_time: "",
      end_time: "",
      room: "",
      semester: "",
      school_year: "",
    });
    setModalOpen(true);
  };

  const openEdit = (s: ClassSchedule) => {
    setEditingId(s.id);
    setForm({
      faculty_id: s.faculty_id || "",
      subject: s.subject || "",
      section: s.section || "",
      day_of_week: s.day_of_week || "",
      start_time: s.start_time ? s.start_time.substring(0, 5) : "",
      end_time: s.end_time ? s.end_time.substring(0, 5) : "",
      room: s.room || "",
      semester: s.semester || "",
      school_year: s.school_year || "",
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.faculty_id) {
      toast({ title: "Validation Error", description: "Faculty is required.", variant: "error" });
      return;
    }
    if (!form.subject.trim()) {
      toast({ title: "Validation Error", description: "Subject is required.", variant: "error" });
      return;
    }
    if (!form.day_of_week) {
      toast({ title: "Validation Error", description: "Day of week is required.", variant: "error" });
      return;
    }

    const facultyUser = faculty.find((f) => f.id === form.faculty_id);

    const payload: Record<string, unknown> = {
      faculty_id: form.faculty_id,
      subject: form.subject.trim(),
      section: form.section.trim() || null,
      day_of_week: form.day_of_week,
      start_time: form.start_time || null,
      end_time: form.end_time || null,
      room: form.room.trim() || null,
      semester: form.semester.trim() || null,
      school_year: form.school_year.trim() || null,
    };

    if (editingId) {
      await supabase.from("class_schedules").update(payload).eq("id", editingId);
      logActivity(undefined, "update", "class_schedule", editingId, {
        subject: payload.subject,
        faculty: facultyUser?.full_name || "",
      });
      toast({ title: "Success", description: "Class schedule updated.", variant: "success" });
    } else {
      const { data } = await supabase
        .from("class_schedules")
        .insert(payload)
        .select()
        .single();
      logActivity(undefined, "create", "class_schedule", data?.id, {
        subject: payload.subject,
        faculty: facultyUser?.full_name || "",
      });
      toast({ title: "Success", description: "Class schedule created.", variant: "success" });
    }
    setModalOpen(false);
    fetchData();
  };

  const openDeleteConfirm = (id: string) => {
    const s = schedules.find((sc) => sc.id === id);
    if (s) {
      setDeletingLabel(`${s.subject} (${s.faculty_name})`);
    }
    setDeletingId(id);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    await supabase.from("class_schedules").delete().eq("id", deletingId);
    logActivity(undefined, "delete", "class_schedule", deletingId, {
      label: deletingLabel,
    });
    setDeleteOpen(false);
    setDeletingId(null);
    setDeletingLabel("");
    fetchData();
    toast({ title: "Deleted", description: "Class schedule removed.", variant: "success" });
  };

  const dayFilters = [
    { value: "all", label: "All", count: stats.total },
    ...DAYS.map((d) => ({ value: d, label: d.substring(0, 3), count: undefined })),
  ];

  const formatTime = (t: string | null) => {
    if (!t) return "-";
    const [h, m] = t.substring(0, 5).split(":");
    const hour = parseInt(h);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${m} ${ampm}`;
  };

  return (
    <div>
      <div className="mb-6 rounded-xl border border-[#dde4ec] bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-bold text-navy">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-light text-teal">
                <CalendarClock className="h-4 w-4" />
              </span>
              Class Schedule Management
            </h2>
          </div>
          <div>
            <Button size="sm" onClick={openCreate} className="gap-1.5 bg-teal hover:bg-teal-dark">
              <Plus className="h-3.5 w-3.5" /> Add Schedule
            </Button>
          </div>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: "Total Schedules", value: stats.total, icon: CalendarClock, color: "#1B2A4A" },
          { label: "Faculty Members", value: stats.faculty, icon: Users, color: "#0D9488" },
          { label: "Today's Classes", value: stats.today, icon: Clock, color: "#6366f1" },
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
        {dayFilters.map((d) => (
          <button
            key={d.value}
            onClick={() => setDayFilter(d.value)}
            className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition-all ${
              dayFilter === d.value
                ? "border-teal bg-teal-light text-teal"
                : "border-[#dde4ec] bg-white text-silver hover:border-teal hover:text-teal"
            }`}
          >
            {d.label}
            {d.count !== undefined && (
              <span className="ml-1 opacity-60">({d.count})</span>
            )}
          </button>
        ))}
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-silver" />
        <Input
          placeholder="Search by subject or section..."
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
                <th className="px-4 py-3">Faculty</th>
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3">Section</th>
                <th className="px-4 py-3">Day</th>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Room</th>
                <th className="px-4 py-3">Semester</th>
                <th className="px-4 py-3">S.Y.</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-[#f0f0f0]">
                    {Array.from({ length: 9 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <Skeleton className="h-4 w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : schedules.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-silver">
                    No class schedules found. Click &ldquo;Add Schedule&rdquo; to create one.
                  </td>
                </tr>
              ) : (
                schedules.map((s) => (
                  <tr key={s.id} className="border-b border-[#f0f0f0] hover:bg-[#f8f9fa]">
                    <td className="px-4 py-3 font-medium text-navy">{s.faculty_name || "-"}</td>
                    <td className="px-4 py-3 text-navy">{s.subject || "-"}</td>
                    <td className="px-4 py-3 text-silver">{s.section || "-"}</td>
                    <td className="px-4 py-3">
                      <span className="inline-block rounded-full bg-teal-light px-2.5 py-0.5 text-[11px] font-semibold text-teal">
                        {s.day_of_week || "-"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-silver">
                      {formatTime(s.start_time)} - {formatTime(s.end_time)}
                    </td>
                    <td className="px-4 py-3 text-silver">{s.room || "-"}</td>
                    <td className="px-4 py-3 text-silver">{s.semester || "-"}</td>
                    <td className="px-4 py-3 text-silver">{s.school_year || "-"}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(s)} className="h-8 w-8 p-0">
                          <Pencil className="h-3.5 w-3.5 text-slate" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openDeleteConfirm(s.id)} className="h-8 w-8 p-0">
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

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-navy">
              {editingId ? "Edit Class Schedule" : "Add Class Schedule"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-medium text-slate">
                Faculty <span className="text-red-500">*</span>
              </label>
              <Select
                value={form.faculty_id || null}
                onValueChange={(v) => setForm({ ...form, faculty_id: v || "" })}
                items={faculty.map((f) => ({ value: f.id, label: f.full_name }))}
              >
                <SelectTrigger className="mt-1 border-[#dde4ec]">
                  <SelectValue placeholder="Select faculty..." />
                </SelectTrigger>
                <SelectContent>
                  {faculty.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate">
                Subject <span className="text-red-500">*</span>
              </label>
              <Input
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                className="mt-1 border-[#dde4ec]"
                placeholder="e.g. Calculus I"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate">Section</label>
              <Input
                value={form.section}
                onChange={(e) => setForm({ ...form, section: e.target.value })}
                className="mt-1 border-[#dde4ec]"
                placeholder="e.g. BSCPE-2A"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate">
                Day of Week <span className="text-red-500">*</span>
              </label>
              <Select
                value={form.day_of_week || null}
                onValueChange={(v) => setForm({ ...form, day_of_week: v || "" })}
              >
                <SelectTrigger className="mt-1 border-[#dde4ec]">
                  <SelectValue placeholder="Select day..." />
                </SelectTrigger>
                <SelectContent>
                  {DAYS.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate">Room</label>
              <Input
                value={form.room}
                onChange={(e) => setForm({ ...form, room: e.target.value })}
                className="mt-1 border-[#dde4ec]"
                placeholder="e.g. Lab 301"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate">Start Time</label>
              <Input
                type="time"
                value={form.start_time}
                onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                className="mt-1 border-[#dde4ec]"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate">End Time</label>
              <Input
                type="time"
                value={form.end_time}
                onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                className="mt-1 border-[#dde4ec]"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate">Semester</label>
              <Input
                value={form.semester}
                onChange={(e) => setForm({ ...form, semester: e.target.value })}
                className="mt-1 border-[#dde4ec]"
                placeholder="e.g. 1st Semester"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate">School Year</label>
              <Input
                value={form.school_year}
                onChange={(e) => setForm({ ...form, school_year: e.target.value })}
                className="mt-1 border-[#dde4ec]"
                placeholder="e.g. 2025-2026"
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
            <Button onClick={handleSave} className="bg-teal hover:bg-teal-dark">
              {editingId ? "Update" : "Create"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Class Schedule"
        description={
          deletingLabel
            ? `Are you sure you want to delete the schedule for "${deletingLabel}"? This action cannot be undone.`
            : "Are you sure you want to delete this class schedule? This action cannot be undone."
        }
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDelete}
      />
    </div>
  );
}
