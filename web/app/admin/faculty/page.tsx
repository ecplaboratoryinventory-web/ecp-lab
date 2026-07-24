"use client";

import { useEffect, useState, useCallback } from "react";
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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Download, Upload, Pencil, Trash2, UserCheck, Users } from "lucide-react";

interface FacultyUser {
  id: string;
  email: string;
  full_name: string | null;
  firstname: string | null;
  lastname: string | null;
  middlename: string | null;
  id_no: string | null;
  department: string | null;
  status: string | null;
  role: string;
}

type DepartmentFilter = "all" | "Engineering" | "Science";
type StatusFilter = "all" | "active" | "inactive";

interface Stats {
  total: number;
  active: number;
  inactive: number;
  engineering: number;
  science: number;
}

interface CsvRow {
  firstname: string;
  lastname: string;
  middlename: string;
  email: string;
  id_no: string;
  department: string;
}

export default function FacultyPage() {
  const supabase = createClient();

  const [faculty, setFaculty] = useState<FacultyUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<DepartmentFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, inactive: 0, engineering: 0, science: 0 });
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewingFaculty, setViewingFaculty] = useState<FacultyUser | null>(null);
  const [csvOpen, setCsvOpen] = useState(false);
  const [csvData, setCsvData] = useState<CsvRow[]>([]);
  const [csvImporting, setCsvImporting] = useState(false);
  const [csvResult, setCsvResult] = useState<{ imported: number; skipped: number; duplicates: number } | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [csvError, setCsvError] = useState("");

  const [form, setForm] = useState({
    firstname: "",
    lastname: "",
    middlename: "",
    email: "",
    id_no: "",
    department: "",
    role: "faculty",
    password: "",
  });

  const ITEMS_PER_PAGE = 10;

  const fetchStats = useCallback(async () => {
    const base = supabase.from("users").select("*", { count: "exact", head: true }).eq("role", "faculty").eq("approved", true);

    const { count: total } = await base;
    const { count: active } = await supabase.from("users").select("*", { count: "exact", head: true }).eq("role", "faculty").eq("approved", true).eq("status", "active");
    const { count: inactive } = await supabase.from("users").select("*", { count: "exact", head: true }).eq("role", "faculty").eq("approved", true).eq("status", "inactive");
    const { count: engineering } = await supabase.from("users").select("*", { count: "exact", head: true }).eq("role", "faculty").eq("approved", true).eq("department", "Engineering");
    const { count: science } = await supabase.from("users").select("*", { count: "exact", head: true }).eq("role", "faculty").eq("approved", true).eq("department", "Science");

    setStats({
      total: total || 0,
      active: active || 0,
      inactive: inactive || 0,
      engineering: engineering || 0,
      science: science || 0,
    });
  }, [supabase]);

  const fetchFaculty = useCallback(async () => {
    setLoading(true);

    let query = supabase
      .from("users")
      .select("*")
      .eq("role", "faculty")
      .eq("approved", true);

    if (departmentFilter !== "all") {
      query = query.eq("department", departmentFilter);
    }

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    if (search) {
      query = query.or(
        `firstname.ilike.%${search}%,lastname.ilike.%${search}%,full_name.ilike.%${search}%,email.ilike.%${search}%,id_no.ilike.%${search}%`
      );
    }

    const { data } = await query.order("lastname", { ascending: true });

    if (data) {
      setFaculty(data as FacultyUser[]);
    } else {
      setFaculty([]);
    }

    setLoading(false);
    setPage(1);
  }, [supabase, search, departmentFilter, statusFilter]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchFaculty();
  }, [fetchFaculty]);

  const totalPages = Math.ceil(faculty.length / ITEMS_PER_PAGE);
  const paginatedFaculty = faculty.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const handleStatClick = (type: "total" | "active" | "inactive" | "engineering" | "science") => {
    setSearch("");
    setPage(1);

    switch (type) {
      case "active":
        setDepartmentFilter("all");
        setStatusFilter("active");
        break;
      case "inactive":
        setDepartmentFilter("all");
        setStatusFilter("inactive");
        break;
      case "engineering":
        setDepartmentFilter("Engineering");
        setStatusFilter("all");
        break;
      case "science":
        setDepartmentFilter("Science");
        setStatusFilter("all");
        break;
      default:
        setDepartmentFilter("all");
        setStatusFilter("all");
        break;
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setForm({ firstname: "", lastname: "", middlename: "", email: "", id_no: "", department: "", role: "faculty", password: "" });
    setModalOpen(true);
  };

  const openEdit = (f: FacultyUser) => {
    setEditingId(f.id);
    setForm({
      firstname: f.firstname || "",
      lastname: f.lastname || "",
      middlename: f.middlename || "",
      email: f.email || "",
      id_no: f.id_no || "",
      department: f.department || "",
      role: f.role || "faculty",
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
    if (!form.email.trim()) {
      toast({ title: "Validation Error", description: "Email is required.", variant: "error" });
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email.trim())) {
      toast({ title: "Validation Error", description: "Please enter a valid email address.", variant: "error" });
      return;
    }
    if (!form.id_no.trim()) {
      toast({ title: "Validation Error", description: "ID Number is required.", variant: "error" });
      return;
    }
    if (!form.department) {
      toast({ title: "Validation Error", description: "Please select a department.", variant: "error" });
      return;
    }

    if (form.email.trim()) {
      const { data: existingEmail } = await supabase
        .from("users")
        .select("id")
        .eq("email", form.email.trim())
        .maybeSingle();
      if (existingEmail && existingEmail.id !== editingId) {
        toast({ title: "Validation Error", description: "Email already exists!", variant: "error" });
        return;
      }
    }
    if (form.id_no.trim()) {
      const { data: existingId } = await supabase
        .from("users")
        .select("id")
        .eq("id_no", form.id_no.trim())
        .maybeSingle();
      if (existingId && existingId.id !== editingId) {
        toast({ title: "Validation Error", description: "ID Number already exists!", variant: "error" });
        return;
      }
    }

    const payload = {
      firstname: form.firstname.trim(),
      lastname: form.lastname.trim(),
      middlename: form.middlename.trim() || null,
      email: form.email.trim(),
      id_no: form.id_no.trim() || null,
      department: form.department || null,
      role: "faculty",
    };

    if (editingId) {
      const updatePayload: Record<string, unknown> = { ...payload };
      if (form.password.trim()) {
        updatePayload.password = form.password;
      }
      await supabase.from("users").update(updatePayload).eq("id", editingId);
      toast({ title: "Success", description: "Faculty updated.", variant: "success" });
    } else {
      const password = form.password.trim() || `${form.lastname.trim()}123`;
      await supabase.from("users").insert({
        ...payload,
        password,
        status: "active",
        approved: true,
      });
      toast({ title: "Success", description: "Faculty added.", variant: "success" });
    }

    setModalOpen(false);
    fetchFaculty();
    fetchStats();
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    await supabase.from("users").delete().eq("id", deletingId);
    setDeleteOpen(false);
    setDeletingId(null);
    fetchFaculty();
    fetchStats();
    toast({ title: "Deleted", description: "Faculty removed.", variant: "success" });
  };

  const handleToggleStatus = async (f: FacultyUser) => {
    const newStatus = f.status === "active" ? "inactive" : "active";
    if (!confirm(`Are you sure you want to ${newStatus === "active" ? "activate" : "deactivate"} this faculty member?`)) return;
    setActionLoading(f.id);
    await supabase.from("users").update({ status: newStatus }).eq("id", f.id);
    setActionLoading(null);
    fetchFaculty();
    fetchStats();
  };

  const openView = (f: FacultyUser) => {
    setViewingFaculty(f);
    setViewOpen(true);
  };

  const handleDownloadTemplate = () => {
    const csv = "First Name*,Last Name*,Middle Name,Email*,Username*,ID Number*,Role\nJohn,Doe,Middle,john.doe@ecp.edu.ph,john.doe,F12345,Faculty\nJane,Smith,Ann,jane.smith@ecp.edu.ph,jane.smith,F67890,Faculty";
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "faculty_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    const today = new Date().toISOString().slice(0, 10);
    const rows = faculty.map((f) => [
      f.firstname || "",
      f.lastname || "",
      f.middlename || "",
      f.email,
      f.id_no || "",
      f.department || "",
      f.status || "",
    ]);
    const csv = ["First Name,Last Name,Middle Name,Email,ID Number,Department,Status", ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `faculty_export_${today}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCsvFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvData([]);
    setCsvResult(null);
    setCsvError("");

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text
        .replace(/^\uFEFF/, "")
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l);

      if (lines.length < 2) {
        setCsvError("CSV file must have a header row and at least one data row.");
        return;
      }

      const headers = lines[0].toLowerCase().split(",");
      const requiredColumns = ["firstname", "lastname", "email", "id_no", "department"];
      const missing = requiredColumns.filter((c) => !headers.includes(c));
      if (missing.length > 0) {
        setCsvError(`Missing required columns: ${missing.join(", ")}`);
        return;
      }

      const firstnameIdx = headers.indexOf("firstname");
      const lastnameIdx = headers.indexOf("lastname");
      const middlenameIdx = headers.indexOf("middlename");
      const emailIdx = headers.indexOf("email");
      const idNoIdx = headers.indexOf("id_no");
      const deptIdx = headers.indexOf("department");

      const parsed: CsvRow[] = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(",");
        parsed.push({
          firstname: (cols[firstnameIdx] || "").trim(),
          lastname: (cols[lastnameIdx] || "").trim(),
          middlename: (cols[middlenameIdx] || "").trim(),
          email: (cols[emailIdx] || "").trim(),
          id_no: (cols[idNoIdx] || "").trim(),
          department: (cols[deptIdx] || "").trim(),
        });
      }
      setCsvData(parsed);
    };
    reader.readAsText(file);
  };

  const handleCsvImport = async () => {
    setCsvImporting(true);
    let imported = 0;
    let skipped = 0;
    let duplicates = 0;

    for (const row of csvData) {
      if (!row.email || !row.firstname || !row.lastname || !row.id_no || !row.department) {
        skipped++;
        continue;
      }

      const { data: existing } = await supabase
        .from("users")
        .select("id")
        .eq("email", row.email)
        .maybeSingle();

      if (existing) {
        duplicates++;
        continue;
      }

      const { error } = await supabase.from("users").insert({
        firstname: row.firstname,
        lastname: row.lastname,
        middlename: row.middlename || null,
        email: row.email,
        id_no: row.id_no || null,
        department: row.department || null,
        role: "faculty",
        status: "active",
        approved: true,
        password: `${row.lastname}123`,
      });

      if (error) {
        skipped++;
      } else {
        imported++;
      }
    }

    setCsvResult({ imported, skipped, duplicates });
    setCsvImporting(false);
    fetchFaculty();
    fetchStats();
    toast({ title: "Import Complete", description: `${imported} imported, ${skipped} skipped, ${duplicates} duplicates.`, variant: "success" });
  };

  const statCards = [
    { label: "Total Faculty", value: stats.total, icon: Users, color: "#1B2A4A", filterType: "total" as const },
    { label: "Active", value: stats.active, icon: UserCheck, color: "#10b981", filterType: "active" as const },
    { label: "Inactive", value: stats.inactive, icon: UserCheck, color: "#94a3b8", filterType: "inactive" as const },
    { label: "Engineering Faculty", value: stats.engineering, icon: Users, color: "#3b82f6", filterType: "engineering" as const },
    { label: "Science Faculty", value: stats.science, icon: Users, color: "#0ea5a0", filterType: "science" as const },
  ];

  const getRoleBadge = (dept: string | null) => {
    const isEngineering = dept === "Engineering";
    return (
      <Badge
        className={
          isEngineering
            ? "bg-blue-100 text-blue-700 hover:bg-blue-100"
            : "bg-teal-light text-teal hover:bg-teal-light"
        }
      >
        {isEngineering ? "Engineering" : "Science"} Faculty
      </Badge>
    );
  };

  const getStatusBadge = (status: string | null) => {
    const isActive = status === "active";
    return (
      <span
        className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase ${
          isActive
            ? "bg-green-100 text-green-700"
            : "bg-gray-100 text-gray-500"
        }`}
      >
        {isActive ? "Active" : "Inactive"}
      </span>
    );
  };

  const getInitial = (f: FacultyUser) => {
    if (f.firstname) return f.firstname.charAt(0).toUpperCase();
    if (f.full_name) return f.full_name.charAt(0).toUpperCase();
    return "F";
  };

  return (
    <div>
      <div className="mb-6 rounded-xl border border-[#dde4ec] bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-bold text-navy">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-light text-teal">
                <Users className="h-4 w-4" />
              </span>
              Faculty Management
            </h2>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleDownloadTemplate} className="gap-1.5 border-[#dde4ec] text-slate">
              <Download className="h-3.5 w-3.5" /> Template
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-1.5 border-[#dde4ec] text-slate">
              <Download className="h-3.5 w-3.5" /> Export CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => { setCsvOpen(true); setCsvData([]); setCsvResult(null); setCsvError(""); }} className="gap-1.5 border-[#dde4ec] text-slate">
              <Upload className="h-3.5 w-3.5" /> Import CSV
            </Button>
            <Button size="sm" onClick={openCreate} className="gap-1.5 bg-teal hover:bg-teal-dark">
              <Plus className="h-3.5 w-3.5" /> Add Faculty
            </Button>
          </div>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {statCards.map((s) => (
          <button
            key={s.label}
            type="button"
            onClick={() => handleStatClick(s.filterType)}
            className="ecp-stat-card text-left cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-silver">{s.label}</p>
                <p className="mt-1 text-3xl font-bold text-navy">{s.value}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: s.color + "15" }}>
                <s.icon className="h-5 w-5" style={{ color: s.color }} />
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {[
          { value: "all" as DepartmentFilter, label: "All Faculty" },
          { value: "Engineering" as DepartmentFilter, label: "Engineering Faculty" },
          { value: "Science" as DepartmentFilter, label: "Science Faculty" },
        ].map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => { setDepartmentFilter(tab.value); setPage(1); }}
            className={`rounded-lg border px-4 py-2 text-sm font-semibold transition-all ${
              departmentFilter === tab.value
                ? "border-teal bg-teal text-white"
                : "border-[#dde4ec] bg-white text-silver hover:border-teal hover:text-teal"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as StatusFilter); setPage(1); }}>
          <SelectTrigger className="w-[150px] border-[#dde4ec] text-sm">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>

        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-silver" />
          <Input
            placeholder="Search by name, email, or ID number..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full border-[#dde4ec] pl-10"
          />
        </div>
      </div>

      <div className="ecp-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#dde4ec] bg-[#f8f9fa] text-xs font-semibold uppercase tracking-wider text-silver">
                <th className="px-4 py-3 w-20">ID #</th>
                <th className="px-4 py-3">Full Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">ID Number</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-[#f0f0f0]">
                    <td className="px-4 py-3"><Skeleton className="h-4 w-12" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-36" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-44" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-5 w-28 rounded-full" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-5 w-16 rounded-full" /></td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Skeleton className="h-8 w-8 rounded" />
                        <Skeleton className="h-8 w-8 rounded" />
                        <Skeleton className="h-8 w-8 rounded" />
                      </div>
                    </td>
                  </tr>
                ))
              ) : paginatedFaculty.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Users className="h-10 w-10 text-silver/40" />
                      <p className="text-sm font-medium text-silver">No faculty found</p>
                      <p className="text-xs text-silver/60">
                        {search || departmentFilter !== "all" || statusFilter !== "all"
                          ? "Try adjusting your filters."
                          : 'Click "Add Faculty" to create the first faculty member.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedFaculty.map((f) => (
                  <tr key={f.id} className="border-b border-[#f0f0f0] hover:bg-[#f8f9fa]">
                    <td className="px-4 py-3 font-mono text-xs text-silver">#{f.id.slice(0, 8)}</td>
                    <td className="px-4 py-3 font-medium text-navy">
                      <button
                        type="button"
                        onClick={() => openView(f)}
                        className="hover:text-teal transition-colors text-left"
                      >
                        {f.full_name || `${f.firstname || ""} ${f.lastname || ""}`.trim() || "-"}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-silver">{f.email}</td>
                    <td className="px-4 py-3 text-silver">{f.department || "-"}</td>
                    <td className="px-4 py-3 font-mono text-xs text-silver">{f.id_no || "-"}</td>
                    <td className="px-4 py-3">{getRoleBadge(f.department)}</td>
                    <td className="px-4 py-3">{getStatusBadge(f.status)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleStatus(f)}
                          disabled={actionLoading === f.id}
                          className="h-8 w-8 p-0"
                          title={f.status === "active" ? "Deactivate" : "Activate"}
                        >
                          {actionLoading === f.id ? (
                            <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-silver border-t-transparent" />
                          ) : (
                            <UserCheck className={`h-3.5 w-3.5 ${f.status === "active" ? "text-green-500" : "text-silver"}`} />
                          )}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openEdit(f)} className="h-8 w-8 p-0">
                          <Pencil className="h-3.5 w-3.5 text-slate" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setDeletingId(f.id); setDeleteOpen(true); }}
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

        {!loading && faculty.length > 0 && (
          <div className="flex items-center justify-between border-t border-[#dde4ec] px-4 py-3">
            <p className="text-sm text-silver">
              Showing {(page - 1) * ITEMS_PER_PAGE + 1}-{Math.min(page * ITEMS_PER_PAGE, faculty.length)} of {faculty.length}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="border-[#dde4ec] text-slate"
              >
                Prev
              </Button>
              <span className="text-sm text-navy font-medium min-w-[60px] text-center">
                Page {page} of {totalPages || 1}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="border-[#dde4ec] text-slate"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-xl sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-navy">{editingId ? "Edit Faculty" : "Add Faculty"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate">First Name <span className="text-red-500">*</span></label>
              <Input value={form.firstname} onChange={(e) => setForm({ ...form, firstname: e.target.value })} className="mt-1 border-[#dde4ec]" placeholder="Juan" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate">Last Name <span className="text-red-500">*</span></label>
              <Input value={form.lastname} onChange={(e) => setForm({ ...form, lastname: e.target.value })} className="mt-1 border-[#dde4ec]" placeholder="Dela Cruz" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate">Middle Name</label>
              <Input value={form.middlename} onChange={(e) => setForm({ ...form, middlename: e.target.value })} className="mt-1 border-[#dde4ec]" placeholder="Santos" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate">ID Number <span className="text-red-500">*</span></label>
              <Input value={form.id_no} onChange={(e) => setForm({ ...form, id_no: e.target.value })} className="mt-1 border-[#dde4ec]" placeholder="F12345" />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-slate">Email <span className="text-red-500">*</span></label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1 border-[#dde4ec]" placeholder="faculty@ecp.edu.ph" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate">Department <span className="text-red-500">*</span></label>
              <Select value={form.department || undefined} onValueChange={(v) => setForm({ ...form, department: v || "" })}>
                <SelectTrigger className="mt-1 border-[#dde4ec]"><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Engineering">Engineering</SelectItem>
                  <SelectItem value="Science">Science</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate">Role</label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v || "faculty" })}>
                <SelectTrigger className="mt-1 border-[#dde4ec]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="faculty">Faculty</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-slate">Password {editingId ? "(leave blank to keep current)" : "(default: Lastname123)"}</label>
              <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="mt-1 border-[#dde4ec]" placeholder={editingId ? "Leave blank to keep current" : "Lastname123"} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setModalOpen(false)} className="border-[#dde4ec]">Cancel</Button>
            <Button onClick={handleSave} className="bg-teal hover:bg-teal-dark">{editingId ? "Update" : "Create"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-navy">Delete Faculty</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-silver">Are you sure you want to delete this faculty member? This action cannot be undone.</p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleteOpen(false)} className="border-[#dde4ec]">Cancel</Button>
            <Button onClick={handleDelete} className="bg-red-500 hover:bg-red-600">Delete</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-navy">Faculty Details</DialogTitle>
          </DialogHeader>
          {viewingFaculty && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal text-lg font-bold text-white">
                  {getInitial(viewingFaculty)}
                </div>
                <div>
                  <p className="font-semibold text-navy">
                    {viewingFaculty.full_name || `${viewingFaculty.firstname || ""} ${viewingFaculty.lastname || ""}`.trim() || "Unknown"}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    {getRoleBadge(viewingFaculty.department)}
                    {getStatusBadge(viewingFaculty.status)}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 rounded-lg border border-[#dde4ec] bg-[#f8f9fa] p-4">
                <div>
                  <p className="text-xs font-medium uppercase text-silver">Email</p>
                  <p className="mt-0.5 font-medium text-navy">{viewingFaculty.email}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase text-silver">ID Number</p>
                  <p className="mt-0.5 font-mono text-sm text-navy">{viewingFaculty.id_no || "-"}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs font-medium uppercase text-silver">Department</p>
                  <p className="mt-0.5 font-medium text-navy">{viewingFaculty.department || "-"}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={csvOpen} onOpenChange={setCsvOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-navy">Batch CSV Upload</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg border border-dashed border-[#dde4ec] bg-[#f8f9fa] p-6 text-center">
              <Upload className="mx-auto h-8 w-8 text-silver" />
              <p className="mt-2 text-sm text-silver">Select a CSV file to import faculty members</p>
              <p className="mt-1 text-xs text-silver/60">Required columns: firstname, lastname, email, id_no, department</p>
              <Input
                type="file"
                accept=".csv"
                onChange={handleCsvFile}
                className="mt-3 border-[#dde4ec]"
              />
            </div>

            {csvError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {csvError}
              </div>
            )}

            {csvData.length > 0 && (
              <>
                <div className="max-h-60 overflow-y-auto rounded-lg border border-[#dde4ec]">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-[#dde4ec] bg-[#f8f9fa] text-xs font-semibold uppercase text-silver">
                        <th className="px-3 py-2">First Name</th>
                        <th className="px-3 py-2">Last Name</th>
                        <th className="px-3 py-2">Middle Name</th>
                        <th className="px-3 py-2">Email</th>
                        <th className="px-3 py-2">ID No</th>
                        <th className="px-3 py-2">Department</th>
                      </tr>
                    </thead>
                    <tbody>
                      {csvData.map((row, i) => (
                        <tr key={i} className="border-b border-[#f0f0f0] last:border-0">
                          <td className="px-3 py-2 text-navy">{row.firstname}</td>
                          <td className="px-3 py-2 text-navy">{row.lastname}</td>
                          <td className="px-3 py-2 text-silver">{row.middlename || "-"}</td>
                          <td className="px-3 py-2 text-silver">{row.email}</td>
                          <td className="px-3 py-2 font-mono text-xs text-silver">{row.id_no || "-"}</td>
                          <td className="px-3 py-2 text-silver">{row.department || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {csvResult && (
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-center">
                      <p className="text-2xl font-bold text-green-700">{csvResult.imported}</p>
                      <p className="text-xs font-medium text-green-600">Imported</p>
                    </div>
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-center">
                      <p className="text-2xl font-bold text-amber-700">{csvResult.skipped}</p>
                      <p className="text-xs font-medium text-amber-600">Skipped</p>
                    </div>
                    <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-center">
                      <p className="text-2xl font-bold text-red-700">{csvResult.duplicates}</p>
                      <p className="text-xs font-medium text-red-600">Duplicates</p>
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleCsvImport}
                  disabled={csvImporting}
                  className="w-full bg-teal hover:bg-teal-dark"
                >
                  {csvImporting ? (
                    <span className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Importing...
                    </span>
                  ) : (
                    `Import ${csvData.length} Faculty Members`
                  )}
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
