"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { Tags, Plus, Pencil, Trash2 } from "lucide-react";
import { logActivity } from "@/lib/logger";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Cell,
  Tooltip,
} from "recharts";

interface Category {
  id: string;
  name: string;
  equipment_count: number;
}

interface SubcategoryRow {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  equipment: { count: number }[];
}

interface Subcategory {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  equipment_count: number;
}

const NAVY_COLORS = ["#1B2A4A", "#253D6B", "#2F508B", "#3A63A4", "#4576BD"];
const TEAL_COLORS = ["#0D9488", "#0FA89B", "#12BDAE", "#14D1C1", "#16E6D4"];

const CATEGORY_ORDER = ["Electronics", "Chemistry", "Physics"];

export default function CategoriesPage() {
  const supabase = createClient();

  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [form, setForm] = useState({ parentId: "", name: "", description: "" });

  const fetchData = async () => {
    setLoading(true);
    const [catsRes, subsRes] = await Promise.all([
      supabase.from("categories").select("id, name, equipment(count)").order("name"),
      supabase
        .from("subcategories")
        .select("id, category_id, name, description, equipment(count)")
        .order("name"),
    ]);

    if (catsRes.data) {
      const mapped: Category[] = (catsRes.data as unknown as CategoryRow[])
        .map((c) => ({
          id: c.id,
          name: c.name,
          equipment_count: c.equipment?.[0]?.count ?? 0,
        }))
        .filter((c) => CATEGORY_ORDER.includes(c.name));
      mapped.sort((a, b) => {
        const ia = CATEGORY_ORDER.indexOf(a.name);
        const ib = CATEGORY_ORDER.indexOf(b.name);
        if (ia === -1 && ib === -1) return a.name.localeCompare(b.name);
        if (ia === -1) return 1;
        if (ib === -1) return -1;
        return ia - ib;
      });
      setCategories(mapped);

      if (subsRes.data) {
        const mainIds = new Set(mapped.map((c) => c.id));
        const mappedSubs: Subcategory[] = (
          subsRes.data as unknown as SubcategoryRow[]
        )
          .map((s) => ({
            id: s.id,
            category_id: s.category_id,
            name: s.name,
            description: s.description,
            equipment_count: s.equipment?.[0]?.count ?? 0,
          }))
          .filter((s) => mainIds.has(s.category_id));
        setSubcategories(mappedSubs);
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    void (async () => {
      await fetchData();
    })();
  }, []);

  const totalSubcategories = subcategories.length;
  const withEquipment = subcategories.filter((s) => s.equipment_count > 0).length;
  const emptySubcategories = subcategories.filter((s) => s.equipment_count === 0).length;

  const openCreate = () => {
    setEditingId(null);
    setForm({ parentId: categories[0]?.id ?? "", name: "", description: "" });
    setModalOpen(true);
  };

  const openEdit = (sub: Subcategory) => {
    setEditingId(sub.id);
    setForm({
      parentId: sub.category_id,
      name: sub.name,
      description: sub.description || "",
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || (!editingId && !form.parentId)) return;

    if (editingId) {
      await supabase
        .from("subcategories")
        .update({ name: form.name.trim(), description: form.description.trim() || null })
        .eq("id", editingId);
      logActivity(undefined, "update", "subcategory", editingId, {
        name: form.name.trim(),
      });
    } else {
      const { data } = await supabase
        .from("subcategories")
        .insert({
          category_id: form.parentId,
          name: form.name.trim(),
          description: form.description.trim() || null,
        })
        .select()
        .single();
      logActivity(undefined, "create", "subcategory", data?.id, {
        name: form.name.trim(),
        category_id: form.parentId,
      });
    }
    setModalOpen(false);
    fetchData();
  };

  const openDeleteConfirm = (id: string) => {
    const sub = subcategories.find((s) => s.id === id);
    if (sub && sub.equipment_count > 0) {
      setDeleteError(
        `Cannot delete "${sub.name}" — it is assigned to ${sub.equipment_count} equipment item(s). Remove or reassign all equipment first.`
      );
      setDeletingId(null);
    } else {
      setDeletingId(id);
      setDeleteError("");
    }
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    const subName = subcategories.find((s) => s.id === deletingId)?.name || "";
    await supabase.from("subcategories").delete().eq("id", deletingId);
    logActivity(undefined, "delete", "subcategory", deletingId, { name: subName });
    setDeleteOpen(false);
    setDeletingId(null);
    fetchData();
  };

  const chartData = categories.map((c) => ({
    name: c.name,
    equipment: c.equipment_count,
  }));

  return (
    <div>
      <div className="mb-6 rounded-xl border border-[#dde4ec] bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-bold text-navy">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-light text-teal">
                <Tags className="h-4 w-4" />
              </span>
              Category Management
            </h2>
            <p className="mt-1 text-sm text-silver">
              Electronics, Chemistry, and Physics are the fixed main categories. You
              can only add, edit, and remove their subcategories.
            </p>
          </div>
          <div>
            <Button
              size="sm"
              onClick={openCreate}
              className="gap-1.5 bg-teal hover:bg-teal-dark"
            >
              <Plus className="h-3.5 w-3.5" /> Add Subcategory
            </Button>
          </div>
        </div>
      </div>

      {!loading && chartData.length > 0 && (
        <div className="mb-6 ecp-card p-4">
          <h3 className="mb-4 text-sm font-semibold text-navy">
            Equipment Distribution by Category
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={chartData}
              margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#dde4ec" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748b" }} />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 12, fill: "#64748b" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #dde4ec",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="equipment" radius={[4, 4, 0, 0]}>
                {chartData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      index % 2 === 0
                        ? NAVY_COLORS[index % NAVY_COLORS.length]
                        : TEAL_COLORS[index % TEAL_COLORS.length]
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: "Main Categories", value: categories.length, color: "#1B2A4A" },
          { label: "Subcategories", value: totalSubcategories, color: "#0D9488" },
          {
            label: "Subcategories W/O Equipment",
            value: emptySubcategories,
            color: "#94a3b8",
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
                <Tags className="h-5 w-5" style={{ color: s.color }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="ecp-card p-4">
              <div className="mb-4 h-5 w-1/2 animate-pulse rounded bg-[#f0f0f0]" />
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="h-9 w-full animate-pulse rounded bg-[#f0f0f0]" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="ecp-card px-4 py-12 text-center text-silver">
          No main categories found.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {categories.map((cat) => {
            const subs = subcategories.filter((s) => s.category_id === cat.id);
            return (
              <div key={cat.id} className="ecp-card flex flex-col p-0">
                <div className="flex items-center justify-between border-b border-[#dde4ec] px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-light text-teal">
                      <Tags className="h-4 w-4" />
                    </span>
                    <h3 className="font-bold text-navy">{cat.name}</h3>
                  </div>
                  <Badge
                    variant="secondary"
                    className="bg-teal-light text-teal"
                  >
                    {cat.equipment_count} item(s)
                  </Badge>
                </div>
                <div className="flex flex-1 flex-col gap-1 p-3">
                  {subs.length === 0 ? (
                    <p className="px-2 py-3 text-center text-sm text-silver">
                      No subcategories yet.
                    </p>
                  ) : (
                    subs.map((sub) => (
                      <div
                        key={sub.id}
                        className="flex items-center justify-between gap-2 rounded-lg px-3 py-2 hover:bg-[#f8f9fa]"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-navy">
                            {sub.name}
                          </p>
                          {sub.description && (
                            <p className="truncate text-xs text-silver">
                              {sub.description}
                            </p>
                          )}
                          <p className="text-xs text-silver">
                            {sub.equipment_count} item(s)
                          </p>
                        </div>
                        <div className="flex shrink-0 gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(sub)}
                            className="h-8 w-8 p-0"
                          >
                            <Pencil className="h-3.5 w-3.5 text-slate" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeleteConfirm(sub.id)}
                            className="h-8 w-8 p-0"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-red-400" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-navy">
              {editingId ? "Edit Subcategory" : "Add Subcategory"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-slate">
                Subcategory Name *
              </label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="mt-1 border-[#dde4ec]"
                placeholder="Subcategory name"
              />
            </div>
            {!editingId && (
              <div>
                <label className="text-xs font-medium text-slate">Category *</label>
                <Select
                  value={form.parentId}
                  onValueChange={(v) => setForm({ ...form, parentId: v ?? "" })}
                  items={categories.map((c) => ({ value: c.id, label: c.name }))}
                >
                  <SelectTrigger className="mt-1 w-full border-[#dde4ec]">
                    <SelectValue placeholder="Select category..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <label className="text-xs font-medium text-slate">Description</label>
              <Input
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                className="mt-1 border-[#dde4ec]"
                placeholder="Short description"
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
              className="bg-teal hover:bg-teal-dark"
            >
              {editingId ? "Update" : "Create"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-navy">
              {deletingId ? "Delete Subcategory" : "Cannot Delete"}
            </DialogTitle>
            <DialogDescription className="text-silver">
              {deletingId
                ? "Are you sure you want to delete this subcategory? This action cannot be undone."
                : deleteError}
            </DialogDescription>
          </DialogHeader>
          {deletingId ? (
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
                className="bg-red-500 hover:bg-red-600"
              >
                Delete
              </Button>
            </div>
          ) : (
            <div className="flex justify-end pt-2">
              <Button
                onClick={() => setDeleteOpen(false)}
                className="bg-teal hover:bg-teal-dark"
              >
                OK
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface CategoryRow {
  id: string;
  name: string;
  equipment: { count: number }[];
}
