"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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

interface CategoryRow {
  id: string;
  name: string;
  description: string | null;
  equipment: { count: number }[];
}

interface Category {
  id: string;
  name: string;
  description: string | null;
  equipment_count: number;
}

const NAVY_COLORS = ["#1B2A4A", "#253D6B", "#2F508B", "#3A63A4", "#4576BD"];
const TEAL_COLORS = ["#0D9488", "#0FA89B", "#12BDAE", "#14D1C1", "#16E6D4"];

export default function CategoriesPage() {
  const supabase = createClient();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [form, setForm] = useState({ name: "", description: "" });

  const fetchCategories = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("categories")
      .select("id, name, description, equipment(count)")
      .order("name");

    if (data) {
      const mapped: Category[] = (data as unknown as CategoryRow[]).map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description,
        equipment_count: c.equipment?.[0]?.count ?? 0,
      }));
      setCategories(mapped);
    }
    setLoading(false);
  };

  useEffect(() => {
    void (async () => {
      await fetchCategories();
    })();
  }, []);

  const totalCategories = categories.length;
  const withEquipment = categories.filter((c) => c.equipment_count > 0).length;
  const emptyCategories = categories.filter((c) => c.equipment_count === 0).length;

  const openCreate = () => {
    setEditingId(null);
    setForm({ name: "", description: "" });
    setModalOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditingId(cat.id);
    setForm({
      name: cat.name,
      description: cat.description || "",
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
    };

    if (editingId) {
      await supabase.from("categories").update(payload).eq("id", editingId);
      logActivity(undefined, "update", "category", editingId, { name: payload.name });
    } else {
      const { data } = await supabase.from("categories").insert(payload).select().single();
      logActivity(undefined, "create", "category", data?.id, { name: payload.name });
    }
    setModalOpen(false);
    fetchCategories();
  };

  const openDeleteConfirm = (id: string) => {
    const cat = categories.find((c) => c.id === id);
    if (cat && cat.equipment_count > 0) {
      setDeleteError(
        `Cannot delete "${cat.name}" — it is assigned to ${cat.equipment_count} equipment item(s). Remove or reassign all equipment first.`
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
    const categoryName = categories.find((c) => c.id === deletingId)?.name || "";
    await supabase.from("categories").delete().eq("id", deletingId);
    logActivity(undefined, "delete", "category", deletingId, { name: categoryName });
    setDeleteOpen(false);
    setDeletingId(null);
    fetchCategories();
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
          </div>
          <div>
            <Button
              size="sm"
              onClick={openCreate}
              className="gap-1.5 bg-teal hover:bg-teal-dark"
            >
              <Plus className="h-3.5 w-3.5" /> Add Category
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
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: "#64748b" }}
              />
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
          { label: "Total Categories", value: totalCategories, color: "#1B2A4A" },
          { label: "With Equipment", value: withEquipment, color: "#0D9488" },
          { label: "Empty", value: emptyCategories, color: "#94a3b8" },
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

      <div className="ecp-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#dde4ec] bg-[#f8f9fa] text-xs font-semibold uppercase tracking-wider text-silver">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3 text-center">Equipment Count</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b border-[#f0f0f0]">
                    {Array.from({ length: 4 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 w-full animate-pulse rounded bg-[#f0f0f0]" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : categories.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-12 text-center text-silver"
                  >
                    No categories found. Click &quot;Add Category&quot; to create one.
                  </td>
                </tr>
              ) : (
                categories.map((cat) => (
                  <tr
                    key={cat.id}
                    className="border-b border-[#f0f0f0] hover:bg-[#f8f9fa]"
                  >
                    <td className="px-4 py-3 font-medium text-navy">
                      {cat.name}
                    </td>
                    <td className="px-4 py-3 text-silver">
                      {cat.description
                        ? cat.description.length > 50
                          ? cat.description.slice(0, 50) + "..."
                          : cat.description
                        : "-"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge
                        variant="secondary"
                        className={
                          cat.equipment_count > 0
                            ? "bg-teal-light text-teal"
                            : "bg-gray-100 text-silver"
                        }
                      >
                        {cat.equipment_count}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(cat)}
                          className="h-8 w-8 p-0"
                        >
                          <Pencil className="h-3.5 w-3.5 text-slate" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDeleteConfirm(cat.id)}
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

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-navy">
              {editingId ? "Edit Category" : "Add Category"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-slate">Name *</label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="mt-1 border-[#dde4ec]"
                placeholder="Category name"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate">
                Description
              </label>
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
              {deletingId ? "Delete Category" : "Cannot Delete"}
            </DialogTitle>
            <DialogDescription className="text-silver">
              {deletingId
                ? "Are you sure you want to delete this category? This action cannot be undone."
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
