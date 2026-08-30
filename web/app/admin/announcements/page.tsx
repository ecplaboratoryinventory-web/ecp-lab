"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { logActivity } from "@/lib/logger";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
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
  Megaphone,
  Trash2,
  Pencil,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";

interface User {
  id: string;
  full_name: string;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  author_id: string;
  target_role: "all" | "student" | "faculty" | "admin";
  priority: "normal" | "high" | "urgent";
  is_active: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  users?: User;
}

type FilterType = "all" | "active" | "inactive";

const TARGET_ROLE_VARIANTS: Record<string, { label: string; className: string }> = {
  all: { label: "All", className: "bg-gray-100 text-gray-700" },
  student: { label: "Student", className: "bg-blue-100 text-blue-700" },
  faculty: { label: "Faculty", className: "bg-teal-100 text-teal-700" },
  admin: { label: "Admin", className: "bg-navy/10 text-navy" },
};

const PRIORITY_VARIANTS: Record<string, { label: string; className: string }> = {
  normal: { label: "Normal", className: "bg-gray-100 text-gray-600" },
  high: { label: "High", className: "bg-amber-100 text-amber-700" },
  urgent: { label: "Urgent", className: "bg-red-100 text-red-700" },
};

const FILTERS: { value: FilterType; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

const CONTENT_PREVIEW_LENGTH = 150;

export default function AnnouncementsPage() {
  const supabase = createClient();

  const [filter, setFilter] = useState<FilterType>("all");
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    content: "",
    target_role: "all" as "all" | "student" | "faculty" | "admin",
    priority: "normal" as "normal" | "high" | "urgent",
    is_active: true,
  });

  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const [confirmTitle, setConfirmTitle] = useState("");
  const [confirmVariant, setConfirmVariant] = useState<"danger" | "warning" | "default">("default");

  const withConfirm = (title: string, variant: "danger" | "warning" | "default", action: () => void) => {
    setConfirmTitle(title);
    setConfirmVariant(variant);
    setConfirmAction(() => action);
    setConfirmOpen(true);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);

    let query = supabase
      .from("announcements")
      .select("*, users!announcements_author_id_fkey(id, full_name)")
      .order("created_at", { ascending: false });

    if (filter === "active") {
      query = query.eq("is_active", true);
    } else if (filter === "inactive") {
      query = query.eq("is_active", false);
    }

    const { data } = await query;
    setAnnouncements((data as Announcement[]) || []);
    setLoading(false);
  }, [supabase, filter]);

  useEffect(() => {
    void (async () => {
      await fetchData();
    })();
  }, [fetchData]);

  const openCreate = () => {
    setEditingId(null);
    setForm({
      title: "",
      content: "",
      target_role: "all",
      priority: "normal",
      is_active: true,
    });
    setModalOpen(true);
  };

  const openEdit = (a: Announcement) => {
    setEditingId(a.id);
    setForm({
      title: a.title,
      content: a.content || "",
      target_role: a.target_role,
      priority: a.priority,
      is_active: a.is_active,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    const payload = {
      title: form.title,
      content: form.content,
      target_role: form.target_role,
      priority: form.priority,
      is_active: form.is_active,
      published_at: form.is_active ? new Date().toISOString() : null,
    };

    if (editingId) {
      await supabase.from("announcements").update(payload).eq("id", editingId);
      logActivity(undefined, "update", "announcement", editingId, { title: form.title });
    } else {
      const { data } = await supabase.from("announcements").insert(payload).select();
      logActivity(undefined, "create", "announcement", data?.[0]?.id, { title: form.title });
    }
    setModalOpen(false);
    fetchData();
  };

  const handleToggleActive = (a: Announcement) => {
    withConfirm(
      `${a.is_active ? "Deactivate" : "Activate"} Announcement?`,
      "warning",
      async () => {
        await supabase
          .from("announcements")
          .update({
            is_active: !a.is_active,
            published_at: !a.is_active ? new Date().toISOString() : a.published_at,
          })
          .eq("id", a.id);
        logActivity(undefined, "update", "announcement", a.id, { title: a.title });
        fetchData();
      }
    );
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    const deletedAnnouncement = announcements.find(a => a.id === deleteConfirm);
    await supabase.from("announcements").delete().eq("id", deleteConfirm);
    logActivity(undefined, "delete", "announcement", deleteConfirm, { title: deletedAnnouncement?.title });
    setDeleteConfirm(null);
    fetchData();
  };

  const getTargetRoleBadge = (role: string) => {
    const config = TARGET_ROLE_VARIANTS[role] || TARGET_ROLE_VARIANTS.all;
    return (
      <span
        className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${config.className}`}
      >
        {config.label}
      </span>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const config = PRIORITY_VARIANTS[priority] || PRIORITY_VARIANTS.normal;
    return (
      <span
        className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${config.className}`}
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

  const truncateContent = (content: string | null) => {
    if (!content) return "";
    if (content.length <= CONTENT_PREVIEW_LENGTH) return content;
    return content.slice(0, CONTENT_PREVIEW_LENGTH).trimEnd() + "...";
  };

  return (
    <>
      <div>
        <div className="mb-6 rounded-xl border border-[#dde4ec] bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-xl font-bold text-navy">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-light text-teal">
                  <Megaphone className="h-4 w-4" />
                </span>
                Announcements
              </h2>
            </div>
            <Button
              size="sm"
              onClick={openCreate}
              className="gap-1.5 bg-teal hover:bg-teal-dark"
            >
              <Plus className="h-3.5 w-3.5" /> New Announcement
            </Button>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition-all ${
                filter === f.value
                  ? "border-teal bg-teal-light text-teal"
                  : "border-[#dde4ec] bg-white text-silver hover:border-teal hover:text-teal"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="ecp-card p-5">
                <div className="mb-3 flex items-start justify-between">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-16 rounded-full" />
                </div>
                <Skeleton className="mb-2 h-4 w-full" />
                <Skeleton className="mb-4 h-4 w-3/4" />
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-6 w-12 rounded" />
                </div>
              </div>
            ))
          ) : announcements.length === 0 ? (
            <div className="col-span-full py-12 text-center text-silver">
              No announcements found
            </div>
          ) : (
            announcements.map((a) => (
              <div
                key={a.id}
                className={`ecp-card overflow-hidden transition-all ${
                  !a.is_active ? "opacity-70" : ""
                }`}
              >
                {a.priority === "urgent" && (
                  <div className="h-1 w-full bg-red-500" />
                )}
                {a.priority === "high" && (
                  <div className="h-1 w-full bg-amber-400" />
                )}
                <div className="p-5">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <h3 className="text-base font-bold text-navy">{a.title}</h3>
                    <div className="flex flex-shrink-0 items-center gap-1.5">
                      {getPriorityBadge(a.priority)}
                      {getTargetRoleBadge(a.target_role)}
                    </div>
                  </div>
                  <p className="mb-3 text-sm leading-relaxed text-silver">
                    {truncateContent(a.content) || (
                      <span className="italic">No content</span>
                    )}
                  </p>
                  <div className="flex items-center justify-between border-t border-[#f0f0f0] pt-3">
                    <div className="flex items-center gap-2 text-xs text-silver">
                      <span className="font-medium text-navy">
                        {a.users?.full_name || "Unknown"}
                      </span>
                      <span>&middot;</span>
                      <span>{formatDate(a.published_at || a.created_at)}</span>
                      <span>&middot;</span>
                      <span
                        className={
                          a.is_active
                            ? "text-green-600 font-medium"
                            : "text-red-400 font-medium"
                        }
                      >
                        {a.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleActive(a)}
                        className="h-8 w-8 p-0"
                        title={a.is_active ? "Deactivate" : "Activate"}
                      >
                        {a.is_active ? (
                          <ToggleRight className="h-4 w-4 text-green-500" />
                        ) : (
                          <ToggleLeft className="h-4 w-4 text-silver" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(a)}
                        className="h-8 w-8 p-0"
                      >
                        <Pencil className="h-3.5 w-3.5 text-slate" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteConfirm(a.id)}
                        className="h-8 w-8 p-0"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-red-400" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="max-w-lg sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-navy">
                {editingId ? "Edit Announcement" : "New Announcement"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate">Title *</label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Announcement title..."
                  className="mt-1 border-[#dde4ec]"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate">Content</label>
                <Textarea
                  value={form.content}
                  onChange={(e) =>
                    setForm({ ...form, content: e.target.value })
                  }
                  placeholder="Write the announcement content..."
                  rows={6}
                  className="mt-1 border-[#dde4ec]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate">
                    Target Role
                  </label>
                  <Select
                    value={form.target_role}
                    onValueChange={(v) =>
                      setForm({
                        ...form,
                        target_role: (v || "all") as typeof form.target_role,
                      })
                    }
                  >
                    <SelectTrigger className="mt-1 w-full border-[#dde4ec]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="faculty">Faculty</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate">
                    Priority
                  </label>
                  <Select
                    value={form.priority}
                    onValueChange={(v) =>
                      setForm({
                        ...form,
                        priority: (v || "normal") as typeof form.priority,
                      })
                    }
                  >
                    <SelectTrigger className="mt-1 w-full border-[#dde4ec]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={form.is_active}
                  onChange={(e) =>
                    setForm({ ...form, is_active: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-[#dde4ec] text-teal focus:ring-teal"
                />
                <label
                  htmlFor="is_active"
                  className="text-sm font-medium text-navy cursor-pointer"
                >
                  Active
                </label>
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
                disabled={!form.title.trim()}
                className="bg-teal hover:bg-teal/90"
              >
                {editingId ? "Update" : "Create"}
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
              <DialogTitle className="text-navy">Delete Announcement</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-silver">
              Are you sure you want to delete this announcement? This action cannot
              be undone.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setDeleteConfirm(null)}
                className="border-[#dde4ec]"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDelete}
                className="bg-red-500 hover:bg-red-600"
              >
                Delete
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={confirmTitle}
        confirmLabel={confirmVariant === "danger" ? "Delete" : "Confirm"}
        variant={confirmVariant}
        onConfirm={() => { confirmAction?.(); setConfirmOpen(false); }}
      />
    </>
  );
}
