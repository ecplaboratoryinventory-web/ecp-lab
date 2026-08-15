"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster, toast } from "@/components/ui/toast";
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
  Pencil,
  Trash2,
  Calendar,
  Clock,
  Loader2,
  GraduationCap,
  DoorOpen,
} from "lucide-react";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
] as const;

type DayOfWeek = (typeof DAYS)[number];

interface ClassSchedule {
  id: string;
  faculty_id: string;
  subject: string;
  section: string;
  day_of_week: DayOfWeek;
  start_time: string;
  end_time: string;
  room: string;
  semester: string;
  school_year: string;
}

interface FormData {
  subject: string;
  section: string;
  day_of_week: DayOfWeek;
  start_time: string;
  end_time: string;
  room: string;
  semester: string;
  school_year: string;
}

const EMPTY_FORM: FormData = {
  subject: "",
  section: "",
  day_of_week: "Monday",
  start_time: "07:00",
  end_time: "08:30",
  room: "",
  semester: "1st Semester",
  school_year: new Date().getFullYear().toString(),
};

const DAY_COLORS: Record<string, { bg: string; accent: string }> = {
  Monday: { bg: "bg-blue-50", accent: "border-l-blue-400" },
  Tuesday: { bg: "bg-teal-50", accent: "border-l-teal" },
  Wednesday: { bg: "bg-purple-50", accent: "border-l-purple-400" },
  Thursday: { bg: "bg-amber-50", accent: "border-l-amber-400" },
  Friday: { bg: "bg-rose-50", accent: "border-l-rose-400" },
};

function formatTime(t: string): string {
  if (!t) return "-";
  const [h, m] = t.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

export default function SchedulePage() {
  const supabase = createClient();

  const [schedules, setSchedules] = useState<ClassSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState("");
  const [userRole, setUserRole] = useState("");
  const [activeDay, setActiveDay] = useState<DayOfWeek | "all">("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [formSaving, setFormSaving] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const isAdmin = userRole === "admin";

  const fetchSchedules = useCallback(async () => {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    setUserId(user.id);

    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = userData?.role ?? "";
    setUserRole(role);

    const query = supabase
      .from("class_schedules")
      .select("*")
      .order("start_time", { ascending: true });

    if (role !== "admin") {
      query.eq("faculty_id", user.id);
    }

    const { data } = await query;
    setSchedules((data as ClassSchedule[]) ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    void (async () => {
      await fetchSchedules();
    })();
  }, [fetchSchedules]);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (s: ClassSchedule) => {
    setEditingId(s.id);
    setForm({
      subject: s.subject ?? "",
      section: s.section ?? "",
      day_of_week: s.day_of_week ?? "Monday",
      start_time: s.start_time?.slice(0, 5) ?? "07:00",
      end_time: s.end_time?.slice(0, 5) ?? "08:30",
      room: s.room ?? "",
      semester: s.semester ?? "1st Semester",
      school_year: s.school_year ?? new Date().getFullYear().toString(),
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.subject.trim() || !form.start_time || !form.end_time) {
      toast.add({
        title: "Validation Error",
        description: "Subject, start time, and end time are required.",
        type: "error",
      });
      return;
    }

    setFormSaving(true);

    const payload = {
      subject: form.subject.trim(),
      section: form.section.trim() || null,
      day_of_week: form.day_of_week,
      start_time: form.start_time,
      end_time: form.end_time,
      room: form.room.trim() || null,
      semester: form.semester,
      school_year: form.school_year,
    };

    if (editingId) {
      const { error } = await supabase
        .from("class_schedules")
        .update(payload)
        .eq("id", editingId);

      if (error) {
        toast.add({
          title: "Error",
          description: "Failed to update class schedule.",
          type: "error",
        });
      } else {
        toast.add({
          title: "Updated",
          description: "Class schedule has been updated.",
          type: "success",
        });
      }
    } else {
      const { error } = await supabase.from("class_schedules").insert({
        ...payload,
        faculty_id: userId,
      });

      if (error) {
        toast.add({
          title: "Error",
          description: "Failed to add class schedule.",
          type: "error",
        });
      } else {
        toast.add({
          title: "Added",
          description: "Class schedule has been added.",
          type: "success",
        });
      }
    }

    setFormSaving(false);
    setModalOpen(false);
    fetchSchedules();
  };

  const confirmDelete = (id: string) => {
    setDeletingId(id);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setDeleteLoading(true);

    const { error } = await supabase
      .from("class_schedules")
      .delete()
      .eq("id", deletingId);

    if (error) {
      toast.add({
        title: "Error",
        description: "Failed to delete class schedule.",
        type: "error",
      });
    } else {
      toast.add({
        title: "Deleted",
        description: "Class schedule has been removed.",
        type: "success",
      });
    }

    setDeleteLoading(false);
    setDeleteOpen(false);
    setDeletingId(null);
    fetchSchedules();
  };

  const canEdit = (s: ClassSchedule) => {
    return isAdmin || s.faculty_id === userId;
  };

  const filtered =
    activeDay === "all"
      ? schedules
      : schedules.filter((s) => s.day_of_week === activeDay);

  const groupedByDay: Record<DayOfWeek, ClassSchedule[]> = {
    Monday: [],
    Tuesday: [],
    Wednesday: [],
    Thursday: [],
    Friday: [],
  };

  schedules.forEach((s) => {
    if (groupedByDay[s.day_of_week]) {
      groupedByDay[s.day_of_week].push(s);
    }
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="mt-4 h-10 w-64 rounded-lg" />
        <div className="grid grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-[300px] rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <Toaster>
      <div className="space-y-6">
        <div className="rounded-xl border border-[#dde4ec] bg-gradient-to-r from-navy to-[#253348] p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">
                Class Schedule
              </h1>
              <p className="mt-1 text-sm text-white/70">
                {isAdmin
                  ? "Manage all faculty class schedules."
                  : "Your weekly class schedule."}
              </p>
            </div>
            {(isAdmin || !loading) && (
              <Button
                onClick={openCreate}
                className="gap-1.5 bg-teal hover:bg-teal-dark"
              >
                <Plus className="h-4 w-4" />
                Add Class
              </Button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveDay("all")}
            className={`rounded-lg border px-4 py-2 text-sm font-semibold transition-all ${
              activeDay === "all"
                ? "border-teal bg-teal text-white"
                : "border-[#dde4ec] bg-white text-silver hover:border-teal hover:text-teal"
            }`}
          >
            All Days
          </button>
          {DAYS.map((day) => (
            <button
              key={day}
              onClick={() => setActiveDay(day)}
              className={`rounded-lg border px-4 py-2 text-sm font-semibold transition-all ${
                activeDay === day
                  ? "border-teal bg-teal text-white"
                  : "border-[#dde4ec] bg-white text-silver hover:border-teal hover:text-teal"
              }`}
            >
              {day}
            </button>
          ))}
        </div>

        {schedules.length === 0 ? (
          <div className="ecp-card flex flex-col items-center justify-center py-20 border-0 shadow-none">
            <Calendar className="mb-3 h-12 w-12 text-silver/40" />
            <p className="text-lg font-semibold text-navy">No classes scheduled</p>
            <p className="mt-1 text-sm text-silver">
              Click &quot;Add Class&quot; to create your first class schedule.
            </p>
          </div>
        ) : activeDay === "all" ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
            {DAYS.map((day) => (
              <div
                key={day}
                className="ecp-card border-0 shadow-none overflow-hidden"
              >
                <div className="bg-gradient-to-b from-navy to-[#253348] px-4 py-3">
                  <h3 className="text-sm font-bold text-white">{day}</h3>
                  <p className="text-[11px] text-white/60">
                    {groupedByDay[day].length} class
                    {groupedByDay[day].length !== 1 ? "es" : ""}
                  </p>
                </div>
                <div className="p-2 space-y-2">
                  {groupedByDay[day].length === 0 ? (
                    <div className="py-6 text-center text-xs text-silver">
                      No classes
                    </div>
                  ) : (
                    groupedByDay[day].map((cls) => (
                      <div
                        key={cls.id}
                        className={`rounded-lg border border-[#dde4ec] bg-white p-3 transition-shadow hover:shadow-sm border-l-[3px] ${DAY_COLORS[day]?.accent ?? "border-l-teal"}`}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <div className="min-w-0 flex-1">
                            <h4 className="text-sm font-semibold text-navy truncate">
                              {cls.subject}
                            </h4>
                            {cls.section && (
                              <p className="mt-0.5 text-xs text-silver">
                                {cls.section}
                              </p>
                            )}
                            <div className="mt-2 flex items-center gap-1.5 text-[11px] text-silver">
                              <Clock className="h-3 w-3" />
                              {formatTime(cls.start_time)} &mdash;{" "}
                              {formatTime(cls.end_time)}
                            </div>
                            {cls.room && (
                              <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-silver">
                                <DoorOpen className="h-3 w-3" />
                                {cls.room}
                              </div>
                            )}
                          </div>
                          {canEdit(cls) && (
                            <div className="flex shrink-0 gap-0.5">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEdit(cls)}
                                className="h-7 w-7 p-0"
                              >
                                <Pencil className="h-3 w-3 text-slate" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => confirmDelete(cls.id)}
                                className="h-7 w-7 p-0"
                              >
                                <Trash2 className="h-3 w-3 text-red-400" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div
            className="ecp-card border-0 shadow-none overflow-hidden"
          >
            <div className="bg-gradient-to-b from-navy to-[#253348] px-4 py-3">
              <h3 className="text-sm font-bold text-white">{activeDay}</h3>
              <p className="text-[11px] text-white/60">
                {filtered.length} class{filtered.length !== 1 ? "es" : ""}
              </p>
            </div>
            <div className="p-4 space-y-3">
              {filtered.length === 0 ? (
                <div className="py-10 text-center text-silver">
                  No classes scheduled for {activeDay}
                </div>
              ) : (
                filtered.map((cls) => (
                  <div
                    key={cls.id}
                    className={`rounded-lg border border-[#dde4ec] bg-white p-4 transition-shadow hover:shadow-sm border-l-[3px] ${DAY_COLORS[activeDay as DayOfWeek]?.accent ?? "border-l-teal"}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h4 className="text-base font-semibold text-navy">
                          {cls.subject}
                        </h4>
                        {cls.section && (
                          <p className="mt-0.5 text-xs text-silver">
                            Section: {cls.section}
                          </p>
                        )}
                        <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
                          <div className="flex items-center gap-1.5 text-slate">
                            <Clock className="h-4 w-4 text-teal" />
                            {formatTime(cls.start_time)} &mdash;{" "}
                            {formatTime(cls.end_time)}
                          </div>
                          {cls.room && (
                            <div className="flex items-center gap-1.5 text-slate">
                              <DoorOpen className="h-4 w-4 text-teal" />
                              {cls.room}
                            </div>
                          )}
                          <div className="flex items-center gap-1.5 text-slate">
                            <GraduationCap className="h-4 w-4 text-teal" />
                            {cls.semester} {cls.school_year}
                          </div>
                        </div>
                      </div>
                      {canEdit(cls) && (
                        <div className="flex shrink-0 gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEdit(cls)}
                            className="gap-1 border-[#dde4ec] text-slate"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => confirmDelete(cls.id)}
                            className="gap-1 border-red-200 text-red-500 hover:bg-red-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-navy">
                {editingId ? "Edit Class" : "Add Class"}
              </DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs font-medium text-slate">
                  Subject <span className="text-red-400">*</span>
                </label>
                <Input
                  value={form.subject}
                  onChange={(e) =>
                    setForm({ ...form, subject: e.target.value })
                  }
                  className="mt-1 border-[#dde4ec]"
                  placeholder="e.g. Calculus I"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate">
                  Section
                </label>
                <Input
                  value={form.section}
                  onChange={(e) =>
                    setForm({ ...form, section: e.target.value })
                  }
                  className="mt-1 border-[#dde4ec]"
                  placeholder="e.g. A-1"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate">
                  Room
                </label>
                <Input
                  value={form.room}
                  onChange={(e) =>
                    setForm({ ...form, room: e.target.value })
                  }
                  className="mt-1 border-[#dde4ec]"
                  placeholder="e.g. Lab 101"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate">
                  Day <span className="text-red-400">*</span>
                </label>
                <Select
                  value={form.day_of_week}
                  onValueChange={(v) =>
                    setForm({ ...form, day_of_week: v as DayOfWeek })
                  }
                >
                  <SelectTrigger className="mt-1 border-[#dde4ec]">
                    <SelectValue />
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
                <label className="text-xs font-medium text-slate">
                  Start Time <span className="text-red-400">*</span>
                </label>
                <Input
                  type="time"
                  value={form.start_time}
                  onChange={(e) =>
                    setForm({ ...form, start_time: e.target.value })
                  }
                  className="mt-1 border-[#dde4ec]"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate">
                  End Time <span className="text-red-400">*</span>
                </label>
                <Input
                  type="time"
                  value={form.end_time}
                  onChange={(e) =>
                    setForm({ ...form, end_time: e.target.value })
                  }
                  className="mt-1 border-[#dde4ec]"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate">
                  Semester
                </label>
                <Select
                  value={form.semester}
                  onValueChange={(v) => setForm({ ...form, semester: v || "1st Semester" })}
                >
                  <SelectTrigger className="mt-1 border-[#dde4ec]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1st Semester">
                      1st Semester
                    </SelectItem>
                    <SelectItem value="2nd Semester">
                      2nd Semester
                    </SelectItem>
                    <SelectItem value="Summer">Summer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate">
                  School Year
                </label>
                <Input
                  value={form.school_year}
                  onChange={(e) =>
                    setForm({ ...form, school_year: e.target.value })
                  }
                  className="mt-1 border-[#dde4ec]"
                  placeholder="2026"
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
              <Button
                onClick={handleSave}
                disabled={formSaving}
                className="gap-1.5 bg-teal hover:bg-teal-dark"
              >
                {formSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                {formSaving
                  ? "Saving..."
                  : editingId
                    ? "Update"
                    : "Create"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-navy">Delete Class</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-silver">
              Are you sure you want to remove this class from your schedule?
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setDeleteOpen(false)}
                className="border-[#dde4ec]"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="bg-red-500 hover:bg-red-600"
              >
                {deleteLoading ? (
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                ) : null}
                {deleteLoading ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Toaster>
  );
}
