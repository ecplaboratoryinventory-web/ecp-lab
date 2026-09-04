"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/components/shared/toast";
import { logActivity } from "@/lib/logger";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Download, Upload, Pencil, Trash2, Microscope, PackageCheck, Clock, AlertTriangle, ImagePlus, Loader2, FileDown } from "lucide-react";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { uploadImage } from "@/lib/cloudinary";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import * as XLSX from "xlsx-js-style";
import { downloadXlsxTemplate } from "@/lib/xlsx-template";

interface Equipment {
  id: string;
  name: string;
  serial_number: string;
  category_id: string;
  subcategory_id: string | null;
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
  subcategories?: { name: string };
}

interface Category {
  id: string;
  name: string;
}

interface Subcategory {
  id: string;
  category_id: string;
  name: string;
}

const CATEGORY_TABS = ["All", "Electronics", "Chemistry", "Physics"] as const;
const CATEGORY_ORDER = ["Electronics", "Chemistry", "Physics"] as const;

// Equipment import template fields (status/available_quantity are auto-set on import)
const IMPORT_FIELD_LABELS: Record<string, string> = {
  name: "Equipment Name",
  category: "Category",
  subcategory: "Subcategory",
  quantity: "Quantity",
  description: "Description",
};

const IMPORT_COLUMN_ALIASES: Record<string, string> = {
  "equipment name": "name",
  name: "name",
  category: "category",
  subcategory: "subcategory",
  quantity: "quantity",
  description: "description",
};

function buildImportColumnMap(rawHeaders: string[]): { keys: string[]; columnByKey: Record<string, number> } {
  const keys: string[] = [];
  const columnByKey: Record<string, number> = {};
  rawHeaders.forEach((raw, idx) => {
    const lower = raw.trim().toLowerCase().replace(/["\r]/g, "");
    const key = IMPORT_COLUMN_ALIASES[lower];
    if (key && columnByKey[key] === undefined) {
      columnByKey[key] = idx;
      keys.push(key);
    }
  });
  return { keys, columnByKey };
}

export default function EquipmentPage() {
  const supabase = createClient();

  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [subcategoryFilter, setSubcategoryFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [stats, setStats] = useState({ total: 0, available: 0, borrowed: 0, damaged: 0 });

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);

  const [importOpen, setImportOpen] = useState(false);
  const [csvPreview, setCsvPreview] = useState<Record<string, string>[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvError, setCsvError] = useState("");
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const withConfirm = (action: () => void) => {
    setConfirmAction(() => action);
    setConfirmOpen(true);
  };

  const [form, setForm] = useState({
    name: "",
    serial_number: "",
    category_id: "",
    subcategory_id: "",
    quantity: 1,
    description: "",
    status: "available",
    image_url: "",
  });

  const fetchData = useCallback(async () => {
    let query = supabase.from("equipment").select("*, categories(name), subcategories(name)");

    if (categoryFilter !== "All") {
      const cat = categories.find((c) => c.name === categoryFilter);
      if (cat) query = query.eq("category_id", cat.id);
    }
    if (subcategoryFilter !== "all") query = query.eq("subcategory_id", subcategoryFilter);
    if (debouncedSearch) query = query.or(`name.ilike.%${debouncedSearch}%,serial_number.ilike.%${debouncedSearch}%`);

    const { data } = await query.order("name");
    if (data) setEquipment(data);

    const { count: total } = await supabase.from("equipment").select("*", { count: "exact", head: true });
    const { count: available } = await supabase.from("equipment").select("*", { count: "exact", head: true }).eq("status", "available");
    const { count: borrowed } = await supabase.from("equipment").select("*", { count: "exact", head: true }).eq("status", "borrowed");
    const { count: damaged } = await supabase.from("equipment").select("*", { count: "exact", head: true }).eq("status", "damaged");
    setStats({ total: total || 0, available: available || 0, borrowed: borrowed || 0, damaged: damaged || 0 });
    setLoading(false);
  }, [supabase, categoryFilter, subcategoryFilter, debouncedSearch, categories]);

  const fetchCategories = useCallback(async () => {
    const { data } = await supabase.from("categories").select("*").order("name");
    if (data) setCategories(data.filter((c: Category) => CATEGORY_ORDER.includes(c.name as typeof CATEGORY_ORDER[number])));
    const { data: subs } = await supabase.from("subcategories").select("id, category_id, name").order("name");
    if (subs) setSubcategories(subs);
  }, [supabase]);

  useEffect(() => {
    void (async () => {
      await fetchCategories();
    })();
  }, [fetchCategories]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    void (async () => {
      await fetchData();
    })();
  }, [fetchData]);

  useEffect(() => {
    const channel = supabase
      .channel('admin-equipment')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'equipment' }, () => fetchData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase, fetchData]);

  const openCreate = () => {
    setEditingId(null);
    setForm({ name: "", serial_number: "", category_id: "", subcategory_id: "", quantity: 1, description: "", status: "available", image_url: "" });
    setModalOpen(true);
  };

  const openEdit = (eq: Equipment) => {
    setEditingId(eq.id);
    setForm({
      name: eq.name,
      serial_number: eq.serial_number || "",
      category_id: eq.category_id || "",
      subcategory_id: (eq as unknown as { subcategory_id?: string }).subcategory_id || "",
      quantity: eq.quantity,
      description: eq.description || "",
      status: eq.status,
      image_url: eq.image_url || "",
    });
    setModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const url = await uploadImage(file);
      setForm((prev) => ({ ...prev, image_url: url }));
    } catch {
      toast({ title: "Upload Failed", description: "Could not upload the image. Check Cloudinary settings.", variant: "error" });
    } finally {
      setUploadingImage(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
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

    let merged = false;
    if (editingId) {
      const payload = { ...form, image_url: form.image_url ? form.image_url : null };
      await supabase.from("equipment").update(payload).eq("id", editingId);
      logActivity(undefined, "update", "equipment", editingId, { name: form.name });
    } else {
      // Merge into an existing identical item (same name + category + subcategory) when it is still Available
      let dupQuery = supabase
        .from("equipment")
        .select("id, quantity, available_quantity, status")
        .ilike("name", form.name.trim())
        .eq("category_id", form.category_id)
        .eq("status", "available");
      if (form.subcategory_id) {
        dupQuery = dupQuery.eq("subcategory_id", form.subcategory_id);
      } else {
        dupQuery = dupQuery.is("subcategory_id", null);
      }
      const { data: existing } = await dupQuery.maybeSingle();

      if (existing) {
        await supabase
          .from("equipment")
          .update({
            quantity: (existing.quantity || 0) + form.quantity,
            available_quantity: (existing.available_quantity || 0) + form.quantity,
          })
          .eq("id", existing.id);
        logActivity(undefined, "update", "equipment", existing.id, { name: form.name, addedStock: form.quantity });
        merged = true;
      } else {
        const payload = { ...form, status: "available", image_url: form.image_url ? form.image_url : null, available_quantity: form.quantity };
        const { data } = await supabase.from("equipment").insert(payload).select("id").single();
        logActivity(undefined, "create", "equipment", data?.id, { name: form.name });
      }
    }
    setModalOpen(false);
    fetchData();
    toast({ title: "Success", description: editingId ? "Equipment updated." : merged ? "Stock added to existing equipment." : "Equipment added.", variant: "success" });
  };

  const handleDelete = (id: string) => {
    withConfirm(async () => {
      await supabase.from("equipment").delete().eq("id", id);
      logActivity(undefined, "delete", "equipment", id);
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

  const handleDownloadTemplate = () => {
    downloadXlsxTemplate(
      [
        "Equipment Name",
        "Category",
        "Subcategory",
        "Quantity",
        "Description",
      ],
      "equipment_import_template.xlsx"
    );
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvError("");
    setCsvPreview([]);
    setCsvHeaders([]);

    const ext = file.name.split(".").pop()?.toLowerCase();
    const requiredColumns = ["name", "category"];

    if (ext === "xlsx" || ext === "xls") {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const aoa = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" }) as unknown[][];
      if (!aoa || aoa.length < 2) {
        setCsvError("File must have a header row and at least one data row.");
        return;
      }
      const headerRow = (aoa[0] || []).map((v) => String(v).trim());
      const { keys: headers, columnByKey } = buildImportColumnMap(headerRow);
      setCsvHeaders(headers);
      const missing = requiredColumns.filter((c) => !headers.includes(c));
      if (missing.length > 0) {
        setCsvError(`Missing required columns: ${missing.map((c) => IMPORT_FIELD_LABELS[c] || c).join(", ")}. Required: Equipment Name, Category`);
        return;
      }
      const rows: Record<string, string>[] = [];
      for (let i = 1; i < aoa.length; i++) {
        const values = (aoa[i] || []).map((v) => String(v).trim());
        if (values.every((v) => v === "")) continue;
        const row: Record<string, string> = {};
        headers.forEach((key) => {
          row[key] = values[columnByKey[key]] || "";
        });
        rows.push(row);
      }
      setCsvPreview(rows);
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const allLines = text.split(/\r?\n/);
      const lines = allLines
        .map((l) => l.trim())
        .filter((l) => l.length > 0 && !l.startsWith("#"));
      if (lines.length < 2) {
        setCsvError("CSV file must have a header row and at least one data row.");
        return;
      }
      const rawHeaders = lines[0].split(",").map((h) => h.trim());
      const { keys: headers, columnByKey } = buildImportColumnMap(rawHeaders);
      setCsvHeaders(headers);

      const missing = requiredColumns.filter((c) => !headers.includes(c));
      if (missing.length > 0) {
        setCsvError(`Missing required columns: ${missing.map((c) => IMPORT_FIELD_LABELS[c] || c).join(", ")}. Required: Equipment Name, Category`);
        return;
      }

      const rows: Record<string, string>[] = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map((v) => v.trim().replace(/["\r]/g, ""));
        const row: Record<string, string> = {};
        headers.forEach((key) => {
          row[key] = values[columnByKey[key]] || "";
        });
        rows.push(row);
      }
      setCsvPreview(rows);
    };
    reader.readAsText(file);
  };

  const handleImportCSV = async () => {
    if (csvPreview.length === 0) return;
    setImporting(true);

    const categoryMap = new Map<string, string>();
    const { data: allCategories } = await supabase.from("categories").select("id, name");
    if (allCategories) {
      allCategories.forEach((c: { id: string; name: string }) => {
        categoryMap.set(c.name.toLowerCase(), c.id);
      });
    }

    const subcategoryMap = new Map<string, { id: string; categoryId: string }>();
    const { data: allSubcategories } = await supabase.from("subcategories").select("id, category_id, name");
    if (allSubcategories) {
      allSubcategories.forEach((s: { id: string; category_id: string; name: string }) => {
        subcategoryMap.set(s.name.toLowerCase(), { id: s.id, categoryId: s.category_id });
      });
    }

    let imported = 0;
    for (const row of csvPreview) {
      if (!row.name || !row.category) continue;

      const categoryName = row.category.trim().toLowerCase();
      let categoryId = categoryMap.get(categoryName);

      if (!categoryId) {
        const { data: newCat } = await supabase
          .from("categories")
          .insert({ name: row.category.trim() })
          .select("id")
          .single();
        if (newCat?.id) {
          categoryId = newCat.id;
          categoryMap.set(categoryName, categoryId!);
        }
      }

      let subcategoryId: string | null = null;
      if (row.subcategory && row.subcategory.trim()) {
        const sub = subcategoryMap.get(row.subcategory.trim().toLowerCase());
        if (sub && (!categoryId || sub.categoryId === categoryId)) {
          subcategoryId = sub.id;
        } else if (sub && categoryId) {
          subcategoryId = sub.id;
        } else {
          const { data: newSub } = await supabase
            .from("subcategories")
            .insert({
              category_id: categoryId,
              name: row.subcategory.trim(),
            })
            .select("id")
            .single();
          if (newSub?.id) {
            subcategoryId = newSub.id;
            subcategoryMap.set(row.subcategory.trim().toLowerCase(), { id: newSub.id, categoryId: categoryId! });
          }
        }
      }

      const equipmentRow = {
        name: row.name.trim(),
        category_id: categoryId || null,
        subcategory_id: subcategoryId,
        quantity: parseInt(row.quantity) || 1,
        available_quantity: parseInt(row.quantity) || 1,
        description: row.description?.trim() || null,
        status: "available",
      };

      // Merge into an existing identical item (same name + category + subcategory) when it is still Available
      let dupQuery = supabase
        .from("equipment")
        .select("id, quantity, available_quantity, status")
        .ilike("name", equipmentRow.name)
        .eq("category_id", categoryId)
        .eq("status", "available");
      if (subcategoryId) {
        dupQuery = dupQuery.eq("subcategory_id", subcategoryId);
      } else {
        dupQuery = dupQuery.is("subcategory_id", null);
      }
      const { data: existing } = await dupQuery.maybeSingle();

      if (existing) {
        const { error: updateError } = await supabase
          .from("equipment")
          .update({
            quantity: (existing.quantity || 0) + equipmentRow.quantity,
            available_quantity: (existing.available_quantity || 0) + equipmentRow.quantity,
          })
          .eq("id", existing.id);
        if (!updateError) imported++;
      } else {
        const { error } = await supabase.from("equipment").insert(equipmentRow);
        if (!error) imported++;
      }
    }

    setImporting(false);
    setImportOpen(false);
    setCsvPreview([]);
    setCsvHeaders([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
    fetchData();
    logActivity(undefined, "import", "equipment", undefined, { count: imported, total: csvPreview.length });
    toast({ title: "Import Complete", description: `${imported} of ${csvPreview.length} items imported.`, variant: "success" });
  };

  const selectedCategoryId =
    categoryFilter === "All"
      ? null
      : categories.find((c) => c.name === categoryFilter)?.id;
  const visibleSubcategories = selectedCategoryId
    ? subcategories.filter((s) => s.category_id === selectedCategoryId)
    : subcategories;

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
              <Button variant="outline" size="sm" onClick={() => setImportOpen(true)} className="gap-1.5 border-[#dde4ec] text-slate">
                <Upload className="h-3.5 w-3.5" /> Import CSV
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownloadTemplate} className="gap-1.5 border-[#dde4ec] text-slate">
                <FileDown className="h-3.5 w-3.5" /> Download Template
              </Button>
              <Button size="sm" onClick={openCreate} className="gap-1.5 bg-teal hover:bg-teal-dark">
                <Plus className="h-3.5 w-3.5" /> Add Equipment
              </Button>
            </div>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { label: "Total Equipment", value: stats.total, icon: Microscope, color: "#3b82f6" },
            { label: "Available", value: stats.available, icon: PackageCheck, color: "#10b981" },
            { label: "Borrowed", value: stats.borrowed, icon: Clock, color: "#f59e0b" },
            { label: "Damaged", value: stats.damaged, icon: AlertTriangle, color: "#ef4444" },
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

        <div className="mb-4 flex flex-wrap gap-2">
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setCategoryFilter(tab);
                setSubcategoryFilter("all");
              }}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
                categoryFilter === tab ? "border-teal bg-teal text-white" : "border-[#dde4ec] bg-white text-silver hover:border-teal hover:text-teal"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {visibleSubcategories.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            <button
              onClick={() => setSubcategoryFilter("all")}
              className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-all ${
                subcategoryFilter === "all"
                  ? "border-teal bg-teal-light text-teal"
                  : "border-[#dde4ec] bg-white text-silver hover:border-teal hover:text-teal"
              }`}
            >
              All Subcategories
            </button>
            {visibleSubcategories.map((s) => (
              <button
                key={s.id}
                onClick={() => setSubcategoryFilter(s.id)}
                className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-all ${
                  subcategoryFilter === s.id
                    ? "border-teal bg-teal-light text-teal"
                    : "border-[#dde4ec] bg-white text-silver hover:border-teal hover:text-teal"
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>
        )}

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
                  <th className="px-4 py-3">Image</th>
                  <th className="px-4 py-3">Equipment</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Subcategory</th>
                  <th className="px-4 py-3 text-center">Qty</th>
                  <th className="px-4 py-3 text-center">Available</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-[#f0f0f0]">
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j} className="px-4 py-3"><div className="h-4 w-full animate-pulse rounded bg-[#f0f0f0]" /></td>
                      ))}
                    </tr>
                  ))
                ) : equipment.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-silver">No equipment found</td>
                  </tr>
                ) : (
                  equipment.map((eq) => (
                    <tr key={eq.id} className="border-b border-[#f0f0f0] hover:bg-[#f8f9fa]">
                      <td className="px-4 py-3">
                        {eq.image_url ? (
                          <Image src={eq.image_url} alt={eq.name} width={40} height={40} unoptimized className="h-10 w-10 rounded-lg object-cover" />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#f0f4f8]">
                            <Microscope className="h-4 w-4 text-silver" />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium text-navy">{eq.name}</td>
                      <td className="px-4 py-3 text-silver">{eq.categories?.name || "-"}</td>
                      <td className="px-4 py-3 text-silver">{eq.subcategories?.name || "-"}</td>
                      <td className="px-4 py-3 text-center">{eq.quantity}</td>
                      <td className="px-4 py-3 text-center">{eq.available_quantity}</td>
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
                <label className="text-xs font-medium text-slate">Item / Equipment Name <span className="text-red-500">*</span></label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 border-[#dde4ec]" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate">Main Category <span className="text-red-500">*</span></label>
                <Select
                  value={form.category_id || null}
                  onValueChange={(v) => setForm({ ...form, category_id: v || "", subcategory_id: "" })}
                >
                  <SelectTrigger className="mt-1 border-[#dde4ec]">
                    <span>{form.category_id ? categories.find((c) => c.id === form.category_id)?.name || "Unknown" : "Select category..."}</span>
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate">Subcategory</label>
                <Select
                  value={form.subcategory_id || null}
                  onValueChange={(v) => setForm({ ...form, subcategory_id: v || "" })}
                  disabled={!form.category_id}
                >
                  <SelectTrigger className="mt-1 border-[#dde4ec]">
                    <span>{form.subcategory_id ? subcategories.find((s) => s.id === form.subcategory_id)?.name || "Unknown" : "Select subcategory..."}</span>
                  </SelectTrigger>
                  <SelectContent>
                    {subcategories
                      .filter((s) => s.category_id === form.category_id)
                      .map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate">Serial / Tag Number</label>
                <Input value={form.serial_number} onChange={(e) => setForm({ ...form, serial_number: e.target.value })} className="mt-1 border-[#dde4ec]" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate">Quantity / Stock <span className="text-red-500">*</span></label>
                <QuantityStepper
                  value={form.quantity}
                  onChange={(value) => setForm({ ...form, quantity: value })}
                  min={1}
                  className="mt-2"
                />
              </div>
              {editingId ? (
                <div>
                  <label className="text-xs font-medium text-slate">Status</label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v || "available" })}>
                    <SelectTrigger className="mt-1 border-[#dde4ec]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="borrowed">Borrowed</SelectItem>
                      <SelectItem value="damaged">Damaged</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ) : null}
              <div className="col-span-2">
                <label className="text-xs font-medium text-slate">Description</label>
                <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1 border-[#dde4ec]" placeholder="Brief description or notes" />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium text-slate">Equipment Image</label>
                <div className="mt-1 flex items-center gap-3">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#dde4ec] bg-[#f8f9fa]">
                    {form.image_url ? (
                      <Image src={form.image_url} alt="Equipment" width={80} height={80} unoptimized className="h-full w-full object-cover" />
                    ) : (
                      <ImagePlus className="h-6 w-6 text-silver/50" />
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <button
                      type="button"
                      onClick={() => imageInputRef.current?.click()}
                      disabled={uploadingImage}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#dde4ec] px-3 py-1.5 text-xs font-semibold text-slate hover:border-teal hover:text-teal disabled:opacity-60"
                    >
                      {uploadingImage ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <ImagePlus className="h-3.5 w-3.5" />
                      )}
                      {uploadingImage ? "Uploading..." : form.image_url ? "Change Image" : "Upload Image"}
                    </button>
                    {form.image_url && (
                      <button
                        type="button"
                        onClick={() => setForm((p) => ({ ...p, image_url: "" }))}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-red-500 hover:text-red-600"
                      >
                        <Trash2 className="h-3 w-3" /> Remove
                      </button>
                    )}
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setModalOpen(false)} className="border-[#dde4ec]">Cancel</Button>
              <Button onClick={handleSave} className="bg-teal hover:bg-teal-dark">{editingId ? "Update" : "Create"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <Dialog open={importOpen} onOpenChange={(open) => {
        setImportOpen(open);
        if (!open) {
          setCsvPreview([]);
          setCsvHeaders([]);
          setCsvError("");
        }
      }}>
        <DialogContent className="max-w-2xl sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-navy">Import Equipment</DialogTitle>
            <DialogDescription className="text-silver">
              Upload a CSV or Excel (.xlsx) file. Required columns: Equipment Name, Category. Optional: Subcategory, Quantity, Description. Imported equipment is automatically marked as Available.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-navy">Upload your file</p>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal hover:underline"
              >
                <FileDown className="h-3.5 w-3.5" /> Download Template
              </button>
            </div>
            <div>
              <label className="text-xs font-medium text-slate">CSV / Excel File</label>
              <Input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileSelect}
                className="mt-1 border-[#dde4ec]"
              />
            </div>

            {csvError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {csvError}
              </div>
            )}

            {csvPreview.length > 0 && (
              <>
                <div>
                  <p className="mb-2 text-xs font-medium text-silver">
                    Preview ({csvPreview.length > 5 ? `first 5 of ${csvPreview.length}` : csvPreview.length} row{csvPreview.length === 1 ? "" : "s"})
                  </p>
                  <div className="max-h-60 overflow-auto rounded-lg border border-[#dde4ec]">
                    <table className="w-full border-collapse text-left text-xs">
                      <thead>
                        <tr className="border-b border-[#dde4ec] bg-[#f8f9fa] font-semibold text-silver">
                          {csvHeaders.map((h, i) => (
                            <th key={i} className="px-3 py-2">{IMPORT_FIELD_LABELS[h] || h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {csvPreview.slice(0, 5).map((row, i) => (
                          <tr key={i} className="border-b border-[#f0f0f0] last:border-0">
                            {csvHeaders.map((h, j) => (
                              <td key={j} className="px-3 py-2">{row[h] || "-"}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setImportOpen(false);
                      setCsvPreview([]);
                      setCsvHeaders([]);
                      setCsvError("");
                    }}
                    className="border-[#dde4ec]"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleImportCSV}
                    disabled={importing}
                    className="bg-teal hover:bg-teal-dark"
                  >
                    {importing ? "Importing..." : `Import ${csvPreview.length} Items`}
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

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
