"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/components/shared/toast";
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
import { Plus, Search, Download, Upload, Pencil, Trash2, Microscope, PackageCheck, Clock, AlertTriangle } from "lucide-react";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";

interface Equipment {
  id: string;
  name: string;
  serial_number: string;
  category_id: string;
  quantity: number;
  available_quantity: number;
  status: string;
  description: string;
  brand: string;
  model: string;
  location: string;
  condition: string;
  purchase_date: string;
  subject_tags: string[] | null;
  image_url: string | null;
  categories?: { name: string };
}

interface Category {
  id: string;
  name: string;
}

export default function EquipmentPage() {
  const supabase = createClient();

  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [stats, setStats] = useState({ total: 0, available: 0, borrowed: 0, maintenance: 0 });

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);

  const withConfirm = (action: () => void) => {
    setConfirmAction(() => action);
    setConfirmOpen(true);
  };

  const [form, setForm] = useState({
    name: "",
    serial_number: "",
    category_id: "",
    quantity: 1,
    description: "",
    brand: "",
    model: "",
    location: "",
    condition: "good",
    purchase_date: "",
    status: "available",
    subject_tags: [] as string[],
    image_url: "",
  });
  const [uploading, setUploading] = useState(false);

  const fetchData = async () => {
    let query = supabase.from("equipment").select("*, categories(name)");

    if (statusFilter !== "all") query = query.eq("status", statusFilter);
    if (categoryFilter !== "all") query = query.eq("category_id", categoryFilter);
    if (debouncedSearch) query = query.or(`name.ilike.%${debouncedSearch}%,serial_number.ilike.%${debouncedSearch}%`);

    const { data } = await query.order("name");
    if (data) setEquipment(data);

    const { count: total } = await supabase.from("equipment").select("*", { count: "exact", head: true });
    const { count: available } = await supabase.from("equipment").select("*", { count: "exact", head: true }).eq("status", "available");
    const { count: borrowed } = await supabase.from("equipment").select("*", { count: "exact", head: true }).eq("status", "borrowed");
    const { count: maintenance } = await supabase.from("equipment").select("*", { count: "exact", head: true }).eq("status", "under_maintenance");

    setStats({ total: total || 0, available: available || 0, borrowed: borrowed || 0, maintenance: maintenance || 0 });
    setLoading(false);
  };

  const fetchCategories = async () => {
    const { data } = await supabase.from("categories").select("*").order("name");
    if (data) setCategories(data);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    fetchData();
  }, [statusFilter, categoryFilter, debouncedSearch]);

  useEffect(() => {
    const channel = supabase
      .channel('admin-equipment')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'equipment' }, () => fetchData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm({ name: "", serial_number: "", category_id: "", quantity: 1, description: "", brand: "", model: "", location: "", condition: "good", purchase_date: "", status: "available", subject_tags: [], image_url: "" });
    setModalOpen(true);
  };

  const openEdit = (eq: Equipment) => {
    setEditingId(eq.id);
    setForm({
      name: eq.name,
      serial_number: eq.serial_number || "",
      category_id: eq.category_id || "",
      quantity: eq.quantity,
      description: eq.description || "",
      brand: eq.brand || "",
      model: eq.model || "",
      location: eq.location || "",
      condition: eq.condition || "good",
      purchase_date: eq.purchase_date || "",
      status: eq.status,
      subject_tags: eq.subject_tags || [],
      image_url: eq.image_url || "",
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast({ title: "Validation Error", description: "Equipment name is required.", variant: "error" });
      return;
    }
    if (form.quantity < 1) {
      toast({ title: "Validation Error", description: "Quantity must be at least 1.", variant: "error" });
      return;
    }
    if (form.serial_number.trim()) {
      const { data: existing } = await supabase
        .from("equipment")
        .select("id")
        .eq("serial_number", form.serial_number.trim())
        .maybeSingle();
      if (existing && existing.id !== editingId) {
        toast({ title: "Validation Error", description: "Serial number already exists!", variant: "error" });
        return;
      }
    }

    if (editingId) {
      await supabase.from("equipment").update(form).eq("id", editingId);
    } else {
      await supabase.from("equipment").insert(form);
    }
    setModalOpen(false);
    fetchData();
    toast({ title: "Success", description: editingId ? "Equipment updated." : "Equipment added.", variant: "success" });
  };

  const handleDelete = (id: string) => {
    withConfirm(async () => {
      await supabase.from("equipment").delete().eq("id", id);
      fetchData();
      toast({ title: "Deleted", description: "Equipment removed.", variant: "success" });
    });
  };

  const handleExportCSV = () => {
    const today = new Date().toISOString().slice(0, 10);
    const rows = equipment.map((e) => [
      e.id,
      e.serial_number,
      e.name,
      e.categories?.name || "",
      e.quantity,
      e.available_quantity,
      e.status,
      e.description || "",
    ]);
    const header = "ID,Code,Name,Category,Quantity,Available,Status,Description";
    const csv = [header, ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `equipment_export_${today}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const statuses = [
    { value: "all", label: "All", count: stats.total },
    { value: "available", label: "Available", count: stats.available },
    { value: "borrowed", label: "In Use", count: stats.borrowed },
    { value: "under_maintenance", label: "Maintenance", count: stats.maintenance },
  ];

  return (
    <>
      <div>
        <div className="mb-6 rounded-xl border border-[#dde4ec] bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-xl font-bold text-navy">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-light text-teal">
                  <Microscope className="h-4 w-4" />
                </span>
                Equipment Management
              </h2>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-1.5 border-[#dde4ec] text-slate">
                <Download className="h-3.5 w-3.5" /> Export CSV
              </Button>
              <Button size="sm" onClick={openCreate} className="gap-1.5 bg-teal hover:bg-teal-dark">
                <Plus className="h-3.5 w-3.5" /> Add Equipment
              </Button>
            </div>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Total Equipment", value: stats.total, icon: Microscope, color: "#3b82f6" },
            { label: "Available", value: stats.available, icon: PackageCheck, color: "#10b981" },
            { label: "In Use", value: stats.borrowed, icon: Clock, color: "#f59e0b" },
            { label: "Under Maintenance", value: stats.maintenance, icon: AlertTriangle, color: "#ef4444" },
          ].map((s) => (
            <div key={s.label} className="ecp-stat-card">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-silver">{s.label}</p>
                  <p className="mt-1 text-3xl font-bold text-navy">{s.value}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: s.color + "15" }}>
                  <s.icon className="h-5 w-5" style={{ color: s.color }} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          {statuses.map((s) => (
            <button
              key={s.value}
              onClick={() => setStatusFilter(s.value)}
              className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition-all ${
                statusFilter === s.value
                  ? "border-teal bg-teal-light text-teal"
                  : "border-[#dde4ec] bg-white text-silver hover:border-teal hover:text-teal"
              }`}
            >
              {s.label} <span className="ml-1 opacity-60">({s.count})</span>
            </button>
          ))}
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          <button
            onClick={() => setCategoryFilter("all")}
            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
              categoryFilter === "all" ? "border-teal bg-teal text-white" : "border-[#dde4ec] bg-white text-silver hover:border-teal hover:text-teal"
            }`}
          >
            All Categories
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setCategoryFilter(c.id)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
                categoryFilter === c.id ? "border-teal bg-teal text-white" : "border-[#dde4ec] bg-white text-silver hover:border-teal hover:text-teal"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-silver" />
          <Input
            placeholder="Search by name or serial number..."
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
                  <th className="px-4 py-3">Equipment</th>
                  <th className="px-4 py-3">Serial #</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3 text-center">Qty</th>
                  <th className="px-4 py-3 text-center">Available</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-[#f0f0f0]">
                      {Array.from({ length: 8 }).map((_, j) => (
                        <td key={j} className="px-4 py-3"><div className="h-4 w-full animate-pulse rounded bg-[#f0f0f0]" /></td>
                      ))}
                    </tr>
                  ))
                ) : equipment.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-silver">No equipment found</td>
                  </tr>
                ) : (
                  equipment.map((eq) => (
                    <tr key={eq.id} className="border-b border-[#f0f0f0] hover:bg-[#f8f9fa]">
                      <td className="px-4 py-3 font-medium text-navy">{eq.name}</td>
                      <td className="px-4 py-3 font-mono text-xs text-silver">{eq.serial_number || "-"}</td>
                      <td className="px-4 py-3 text-silver">{eq.categories?.name || "-"}</td>
                      <td className="px-4 py-3 text-center">{eq.quantity}</td>
                      <td className="px-4 py-3 text-center">{eq.available_quantity}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase ${
                          eq.status === "available" ? "bg-green-100 text-green-700" :
                          eq.status === "borrowed" ? "bg-blue-100 text-blue-700" :
                          "bg-amber-100 text-amber-700"
                        }`}>
                          {eq.status === "under_maintenance" ? "Maintenance" : eq.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-silver">{eq.location || "-"}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(eq)} className="h-8 w-8 p-0">
                            <Pencil className="h-3.5 w-3.5 text-slate" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(eq.id)} className="h-8 w-8 p-0">
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
          <DialogContent className="max-w-xl sm:max-w-xl">
            <DialogHeader>
              <DialogTitle className="text-navy">{editingId ? "Edit Equipment" : "Add Equipment"}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs font-medium text-slate">Name <span className="text-red-500">*</span></label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 border-[#dde4ec]" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate">Serial Number</label>
                <Input value={form.serial_number} onChange={(e) => setForm({ ...form, serial_number: e.target.value })} className="mt-1 border-[#dde4ec]" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate">Category</label>
                <Select value={form.category_id || undefined} onValueChange={(v) => setForm({ ...form, category_id: v || "" })}>
                  <SelectTrigger className="mt-1 border-[#dde4ec]">
                    <span>{form.category_id ? categories.find((c) => c.id === form.category_id)?.name || "Unknown" : "Select category..."}</span>
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate">Quantity <span className="text-red-500">*</span></label>
                <Input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: +e.target.value })} className="mt-1 border-[#dde4ec]" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate">Status</label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v || "available" })}>
                  <SelectTrigger className="mt-1 border-[#dde4ec]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="borrowed">Borrowed</SelectItem>
                    <SelectItem value="under_maintenance">Under Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate">Brand</label>
                <Input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} className="mt-1 border-[#dde4ec]" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate">Model</label>
                <Input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} className="mt-1 border-[#dde4ec]" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate">Location</label>
                <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="mt-1 border-[#dde4ec]" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate">Condition</label>
                <Select value={form.condition} onValueChange={(v) => setForm({ ...form, condition: v || "good" })}>
                  <SelectTrigger className="mt-1 border-[#dde4ec]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="fair">Fair</SelectItem>
                    <SelectItem value="poor">Poor</SelectItem>
                    <SelectItem value="needs_replacement">Needs Replacement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate">Purchase Date</label>
                <Input type="date" value={form.purchase_date} onChange={(e) => setForm({ ...form, purchase_date: e.target.value })} className="mt-1 border-[#dde4ec]" />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium text-slate">Description</label>
                <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1 border-[#dde4ec]" />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium text-slate">Subject Tags (comma-separated)</label>
                <Input
                  value={form.subject_tags.join(", ")}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      subject_tags: e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                  className="mt-1 border-[#dde4ec]"
                  placeholder="e.g., BSCpE, STEM, Chemistry, Physics"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setModalOpen(false)} className="border-[#dde4ec]">Cancel</Button>
              <Button onClick={handleSave} className="bg-teal hover:bg-teal-dark">{editingId ? "Update" : "Create"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete Equipment?"
        description="Are you sure you want to delete this equipment?"
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => { confirmAction?.(); setConfirmOpen(false); }}
      />
    </>
  );
}
