"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/components/shared/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import {
  Plus,
  Search,
  Download,
  Upload,
  Pencil,
  Trash2,
  GraduationCap,
  Users,
  UserCheck,
  UserX,
  BookOpen,
} from "lucide-react";

interface Student {
  id: string;
  email: string;
  firstname: string;
  lastname: string;
  middlename: string | null;
  id_no: string | null;
  course: string | null;
  section: string | null;
  status: string;
  approved: boolean;
  created_at: string;
}

interface CsvRow {
  firstname: string;
  lastname: string;
  middlename: string;
  id_no: string;
  email: string;
  course: string;
  section: string;
  enrolled_subjects: string;
}

const COURSES = [
  { value: "BSCPE", label: "BSCPE" },
  { value: "STEM", label: "STEM" },
  { value: "HUMSS", label: "HUMSS" },
  { value: "ABM", label: "ABM" },
];

export default function StudentsPage() {
  const supabase = createClient();

  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, courses: 0 });

  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [importOpen, setImportOpen] = useState(false);
  const [csvPreview, setCsvPreview] = useState<CsvRow[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [csvError, setCsvError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    firstname: "",
    lastname: "",
    middlename: "",
    id_no: "",
    email: "",
    course: "",
    section: "",
    password: "",
  });

  const fetchData = async () => {
    setLoading(true);

    const { count: total } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("role", "student");

    const { count: active } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("role", "student")
      .eq("status", "active");

    const { count: inactive } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("role", "student")
      .eq("status", "inactive");

    const { data: coursesData } = await supabase
      .from("users")
      .select("course")
      .eq("role", "student")
      .not("course", "is", null);

    const uniqueCourses = new Set<string>();
    if (coursesData) {
      coursesData.forEach((c) => {
        if (c.course) uniqueCourses.add(c.course);
      });
    }

    setStats({ total: total || 0, active: active || 0, inactive: inactive || 0, courses: uniqueCourses.size });

    let query = supabase
      .from("users")
      .select("*")
      .eq("role", "student")
      .order("lastname", { ascending: true });

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }
    if (search) {
      query = query.or(
        `firstname.ilike.%${search}%,lastname.ilike.%${search}%,id_no.ilike.%${search}%,email.ilike.%${search}%`
      );
    }

    const { data } = await query;
    if (data) setStudents(data as Student[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [search, statusFilter]);

  const openCreate = () => {
    setEditingId(null);
    setForm({ firstname: "", lastname: "", middlename: "", id_no: "", email: "", course: "", section: "", password: "" });
    setModalOpen(true);
  };

  const openEdit = (s: Student) => {
    setEditingId(s.id);
    setForm({
      firstname: s.firstname || "",
      lastname: s.lastname || "",
      middlename: s.middlename || "",
      id_no: s.id_no || "",
      email: s.email || "",
      course: s.course || "",
      section: s.section || "",
      password: "",
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.firstname.trim()) {
      toast({ title: "Validation Error", description: "First name is required.", variant: "error" });
      return;
    }
    if (!form.lastname.trim()) {
      toast({ title: "Validation Error", description: "Last name is required.", variant: "error" });
      return;
    }
    if (!form.id_no.trim()) {
      toast({ title: "Validation Error", description: "Student number is required.", variant: "error" });
      return;
    }
    if (!form.course) {
      toast({ title: "Validation Error", description: "Course is required.", variant: "error" });
      return;
    }

    if (form.id_no.trim()) {
      const { data: existing } = await supabase
        .from("users")
        .select("id")
        .eq("id_no", form.id_no.trim())
        .eq("role", "student")
        .maybeSingle();
      if (existing && existing.id !== editingId) {
        toast({ title: "Validation Error", description: "Student number already exists!", variant: "error" });
        return;
      }
    }

    const payload = {
      firstname: form.firstname.trim(),
      lastname: form.lastname.trim(),
      middlename: form.middlename.trim() || null,
      id_no: form.id_no.trim() || null,
      email: form.email.trim(),
      course: form.course || null,
      section: form.section.trim() || null,
    };

    if (editingId) {
      await supabase.from("users").update(payload).eq("id", editingId);
      toast({ title: "Success", description: "Student updated.", variant: "success" });
    } else {
      const password = form.password.trim() || `${form.lastname.trim()}123`;
      await supabase.from("users").insert({
        ...payload,
        role: "student",
        approved: true,
        status: "active",
        password,
      });
      toast({ title: "Success", description: "Student added.", variant: "success" });
    }
    setModalOpen(false);
    fetchData();
  };

  const openDeleteConfirm = (id: string) => {
    setDeletingId(id);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    await supabase.from("users").delete().eq("id", deletingId);
    setDeleteOpen(false);
    setDeletingId(null);
    fetchData();
    toast({ title: "Deleted", description: "Student removed.", variant: "success" });
  };

  const handleExportCSV = () => {
    const today = new Date().toISOString().slice(0, 10);
    const rows = students.map((s) => [
      s.id_no || "",
      s.firstname || "",
      s.lastname || "",
      s.middlename || "",
      s.section || "",
      s.course || "",
      s.status,
      s.created_at ? new Date(s.created_at).toISOString().slice(0, 10) : "",
    ]);
    const header = "student_number,firstname,lastname,middlename,section,course,status,created_at";
    const csv = [header, ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `students_export_${today}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvError("");
    setCsvPreview([]);
    setCsvHeaders([]);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.trim().split("\n");
      if (lines.length < 2) {
        setCsvError("CSV file must have a header row and at least one data row.");
        return;
      }
      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/["\r]/g, ""));
      setCsvHeaders(lines[0].split(",").map((h) => h.trim().replace(/["\r]/g, "")));

      const requiredColumns = ["firstname", "lastname", "id_no", "course"];
      const missing = requiredColumns.filter((c) => !headers.includes(c));
      if (missing.length > 0) {
        setCsvError(`Missing required columns: ${missing.join(", ")}`);
        return;
      }

      const rows: CsvRow[] = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map((v) => v.trim().replace(/["\r]/g, ""));
        const row: Record<string, string> = {};
        headers.forEach((h, idx) => {
          row[h] = values[idx] || "";
        });
        rows.push({
          firstname: row.firstname || "",
          lastname: row.lastname || "",
          middlename: row.middlename || "",
          id_no: row.id_no || "",
          email: row.email || "",
          course: row.course || "",
          section: row.section || "",
          enrolled_subjects: row.enrolled_subjects || "",
        });
      }
      setCsvPreview(rows);
    };
    reader.readAsText(file);
  };

  const handleImportCSV = async () => {
    if (csvPreview.length === 0) return;
    setImporting(true);
    const toInsert = csvPreview
      .filter((r) => r.firstname && r.lastname && r.id_no && r.course)
      .map((r) => ({
        firstname: r.firstname,
        lastname: r.lastname,
        middlename: r.middlename || null,
        id_no: r.id_no || null,
        email: r.email,
        course: r.course || null,
        section: r.section || null,
        enrolled_subjects: r.enrolled_subjects
          ? r.enrolled_subjects.split(",").map((s) => s.trim()).filter(Boolean)
          : null,
        role: "student",
        approved: true,
        status: "active",
        password: `${r.lastname}123`,
      }));

    let imported = 0;
    for (const row of toInsert) {
      const { error } = await supabase.from("users").insert(row);
      if (!error) imported++;
    }
    setImporting(false);
    setImportOpen(false);
    setCsvPreview([]);
    setCsvHeaders([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
    fetchData();
    toast({ title: "Import Complete", description: `${imported} of ${csvPreview.length} students imported.`, variant: "success" });
  };

  const statuses = [
    { value: "all", label: "All", count: stats.total },
    { value: "active", label: "Active", count: stats.active },
    { value: "inactive", label: "Inactive", count: stats.inactive },
  ];

  return (
    <div>
      <div className="mb-6 rounded-xl border border-[#dde4ec] bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-bold text-navy">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-light text-teal">
                <GraduationCap className="h-4 w-4" />
              </span>
              Student Management
            </h2>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-1.5 border-[#dde4ec] text-slate">
              <Download className="h-3.5 w-3.5" /> Export CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => setImportOpen(true)} className="gap-1.5 border-[#dde4ec] text-slate">
              <Upload className="h-3.5 w-3.5" /> Import CSV
            </Button>
            <Button size="sm" onClick={openCreate} className="gap-1.5 bg-teal hover:bg-teal-dark">
              <Plus className="h-3.5 w-3.5" /> Add Student
            </Button>
          </div>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Students", value: stats.total, icon: Users, color: "#3b82f6" },
          { label: "Active", value: stats.active, icon: UserCheck, color: "#10b981" },
          { label: "Inactive", value: stats.inactive, icon: UserX, color: "#94a3b8" },
          { label: "Courses", value: stats.courses, icon: BookOpen, color: "#6366f1" },
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

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-silver" />
        <Input
          placeholder="Search by name, email, or student #..."
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
                <th className="px-4 py-3">Student #</th>
                <th className="px-4 py-3">Full Name</th>
                <th className="px-4 py-3">Course</th>
                <th className="px-4 py-3">Section</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-[#f0f0f0]">
                    <td className="px-4 py-3">
                      <Skeleton className="h-4 w-20" />
                    </td>
                    <td className="px-4 py-3">
                      <Skeleton className="h-4 w-40" />
                    </td>
                    <td className="px-4 py-3">
                      <Skeleton className="h-4 w-16" />
                    </td>
                    <td className="px-4 py-3">
                      <Skeleton className="h-4 w-20" />
                    </td>
                    <td className="px-4 py-3">
                      <Skeleton className="h-4 w-36" />
                    </td>
                    <td className="px-4 py-3">
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Skeleton className="h-8 w-8 rounded" />
                        <Skeleton className="h-8 w-8 rounded" />
                      </div>
                    </td>
                  </tr>
                ))
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-silver">
                    No students found
                  </td>
                </tr>
              ) : (
                students.map((s) => (
                  <tr key={s.id} className="border-b border-[#f0f0f0] hover:bg-[#f8f9fa]">
                    <td className="px-4 py-3 font-mono text-xs text-silver">{s.id_no || "-"}</td>
                    <td className="px-4 py-3 font-medium text-navy">
                      {[s.firstname, s.lastname].filter(Boolean).join(" ") || "-"}
                    </td>
                    <td className="px-4 py-3 text-silver">{s.course || "-"}</td>
                    <td className="px-4 py-3 text-silver">{s.section || "-"}</td>
                    <td className="px-4 py-3 text-silver">{s.email}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase ${
                          s.status === "active"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>
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
        <DialogContent className="max-w-xl sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-navy">{editingId ? "Edit Student" : "Add Student"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate">First Name <span className="text-red-500">*</span></label>
              <Input
                value={form.firstname}
                onChange={(e) => setForm({ ...form, firstname: e.target.value })}
                className="mt-1 border-[#dde4ec]"
                placeholder="First name"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate">Last Name <span className="text-red-500">*</span></label>
              <Input
                value={form.lastname}
                onChange={(e) => setForm({ ...form, lastname: e.target.value })}
                className="mt-1 border-[#dde4ec]"
                placeholder="Last name"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate">Middle Name</label>
              <Input
                value={form.middlename}
                onChange={(e) => setForm({ ...form, middlename: e.target.value })}
                className="mt-1 border-[#dde4ec]"
                placeholder="Middle name"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate">Student # <span className="text-red-500">*</span></label>
              <Input
                value={form.id_no}
                onChange={(e) => setForm({ ...form, id_no: e.target.value })}
                className="mt-1 border-[#dde4ec]"
                placeholder="ID number"
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-slate">Email</label>
              <Input
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="mt-1 border-[#dde4ec]"
                placeholder="Email address"
                type="email"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate">Course <span className="text-red-500">*</span></label>
              <Select value={form.course || undefined} onValueChange={(v) => setForm({ ...form, course: v || "" })}>
                <SelectTrigger className="mt-1 border-[#dde4ec]">
                  <SelectValue placeholder="Select course..." />
                </SelectTrigger>
                <SelectContent>
                  {COURSES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate">Section</label>
              <Input
                value={form.section}
                onChange={(e) => setForm({ ...form, section: e.target.value })}
                className="mt-1 border-[#dde4ec]"
                placeholder="Section"
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-slate">
                Password {editingId ? "(leave blank to keep current)" : "(default: Lastname123)"}
              </label>
              <Input
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="mt-1 border-[#dde4ec]"
                placeholder={editingId ? "Leave blank to keep current" : "Lastname123"}
                type="password"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setModalOpen(false)} className="border-[#dde4ec]">
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-teal hover:bg-teal-dark">
              {editingId ? "Update" : "Create"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-navy">Delete Student</DialogTitle>
            <DialogDescription className="text-silver">
              Are you sure you want to delete this student? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteOpen(false);
                setDeletingId(null);
              }}
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

      <Dialog open={importOpen} onOpenChange={(open) => {
        setImportOpen(open);
        if (!open) {
          setCsvPreview([]);
          setCsvHeaders([]);
          setCsvError("");
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-navy">Import Students from CSV</DialogTitle>
            <DialogDescription className="text-silver">
              Upload a CSV file with columns: firstname, lastname, id_no, course (required), plus middlename, email, section, enrolled_subjects
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate">CSV File</label>
              <Input
                ref={fileInputRef}
                type="file"
                accept=".csv"
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
                    Preview ({csvPreview.length > 5 ? `first 5 of ${csvPreview.length}` : `${csvPreview.length}`} rows)
                  </p>
                  <div className="max-h-60 overflow-auto rounded-lg border border-[#dde4ec]">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-[#dde4ec] bg-[#f8f9fa] font-semibold text-silver">
                          {csvHeaders.map((h, i) => (
                            <th key={i} className="px-3 py-2">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {csvPreview.slice(0, 5).map((row, i) => (
                          <tr key={i} className="border-b border-[#f0f0f0] last:border-0">
                            <td className="px-3 py-2">{row.firstname}</td>
                            <td className="px-3 py-2">{row.lastname}</td>
                            <td className="px-3 py-2">{row.middlename || "-"}</td>
                            <td className="px-3 py-2">{row.id_no || "-"}</td>
                            <td className="px-3 py-2">{row.email}</td>
                            <td className="px-3 py-2">{row.course || "-"}</td>
                            <td className="px-3 py-2">{row.section || "-"}</td>
                            <td className="px-3 py-2">{row.enrolled_subjects || "-"}</td>
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
                    {importing ? "Importing..." : `Import ${csvPreview.length} Students`}
                  </Button>
                </div>
              </>
            )}

            {csvPreview.length === 0 && !csvError && (
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setImportOpen(false);
                    setCsvError("");
                  }}
                  className="border-[#dde4ec]"
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
