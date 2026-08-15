"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollText, Search, Download, Calendar, FileText } from "lucide-react";
import { generateActivityLogPDF } from "@/lib/pdf";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

const COLORS = [
  "#0ea5a0",
  "#3b82f6",
  "#f59e0b",
  "#10b981",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
];

const ACTION_VARIANTS: Record<
  string,
  { label: string; className: string }
> = {
  create: { label: "Create", className: "bg-green-100 text-green-700" },
  update: { label: "Update", className: "bg-blue-100 text-blue-700" },
  delete: { label: "Delete", className: "bg-red-100 text-red-700" },
  approve: { label: "Approve", className: "bg-teal-100 text-teal-700" },
  reject: { label: "Reject", className: "bg-red-100 text-red-700" },
  return: { label: "Return", className: "bg-amber-100 text-amber-700" },
  login: { label: "Login", className: "bg-blue-100 text-blue-700" },
  logout: { label: "Logout", className: "bg-gray-100 text-gray-600" },
};

const ACTION_TYPES = [
  "All",
  "create",
  "update",
  "delete",
  "approve",
  "reject",
  "return",
  "login",
  "logout",
] as const;

interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
  users: { full_name: string | null } | null;
}

interface ActionCount {
  name: string;
  value: number;
}

const PAGE_SIZE = 20;

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("All");

  const [actionCounts, setActionCounts] = useState<ActionCount[]>([]);
  const [equipmentStatus, setEquipmentStatus] = useState<ActionCount[]>([]);
  const [studentStatus, setStudentStatus] = useState<ActionCount[]>([]);
  const [chartTab, setChartTab] = useState<
    "All" | "Actions" | "Equipment" | "Users"
  >("All");

  const supabase = createClient();

  const fetchLogs = useCallback(async () => {
    setLoading(true);

    let query = supabase
      .from("activity_logs")
      .select("*, users!activity_logs_user_id_fkey(full_name)", {
        count: "exact",
      })
      .order("created_at", { ascending: false });

    if (dateFrom) {
      query = query.gte("created_at", `${dateFrom}T00:00:00`);
    }
    if (dateTo) {
      query = query.lte("created_at", `${dateTo}T23:59:59`);
    }
    if (actionFilter !== "All") {
      query = query.eq("action", actionFilter);
    }
    if (search) {
      query = query.or(
        `action.ilike.%${search}%,details->>'description'.ilike.%${search}%`,
      );
    }

    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, count } = await query.range(from, to);

    if (data) {
      setLogs(data as ActivityLog[]);
    } else {
      setLogs([]);
    }
    setTotalCount(count || 0);
    setLoading(false);
  }, [dateFrom, dateTo, search, actionFilter, page]);

  const fetchChartData = useCallback(async () => {
    const { data: logData } = await supabase
      .from("activity_logs")
      .select("action");

    if (logData) {
      const counts: Record<string, number> = {
        create: 0,
        update: 0,
        delete: 0,
        approve: 0,
        reject: 0,
        return: 0,
      };
      logData.forEach((l) => {
        if (counts[l.action] !== undefined) {
          counts[l.action]++;
        }
      });
      setActionCounts(
        Object.entries(counts)
          .filter(([, v]) => v > 0)
          .map(([name, value]) => ({ name, value })),
      );
    }

    const { data: eqData } = await supabase
      .from("equipment")
      .select("status");
    if (eqData) {
      const counts: Record<string, number> = {
        available: 0,
        borrowed: 0,
        under_maintenance: 0,
      };
      eqData.forEach((e) => {
        if (counts[e.status] !== undefined) {
          counts[e.status]++;
        }
      });
      setEquipmentStatus(
        Object.entries(counts)
          .filter(([, v]) => v > 0)
          .map(([name, value]) => ({ name, value })),
      );
    }

    const { data: studData } = await supabase
      .from("users")
      .select("status")
      .in("role", ["student"]);
    if (studData) {
      const counts: Record<string, number> = { active: 0, inactive: 0 };
      studData.forEach((s) => {
        if (counts[s.status] !== undefined) {
          counts[s.status]++;
        }
      });
      setStudentStatus(
        Object.entries(counts)
          .filter(([, v]) => v > 0)
          .map(([name, value]) => ({ name, value })),
      );
    }
  }, []);

  useEffect(() => {
    void (async () => {
      await fetchLogs();
    })();
  }, [fetchLogs]);

  useEffect(() => {
    void (async () => {
      await fetchChartData();
    })();
  }, [fetchChartData]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const formatTimestamp = (date: string) => {
    return new Date(date).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getActionBadge = (action: string) => {
    const config = ACTION_VARIANTS[action] || {
      label: action,
      className: "bg-zinc-100 text-zinc-700",
    };
    return (
      <span
        className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase ${config.className}`}
      >
        {config.label}
      </span>
    );
  };

  const getInitial = (name: string | null) => {
    if (!name) return "?";
    return name.charAt(0).toUpperCase();
  };

  const formatDetails = (details: Record<string, unknown> | null) => {
    if (!details) return "-";
    try {
      const str = JSON.stringify(details);
      return str.length > 60 ? str.slice(0, 60) + "..." : str;
    } catch {
      return String(details);
    }
  };

  const handleExportCSV = () => {
    const today = new Date().toISOString().slice(0, 10);
    const headers = [
      "Timestamp",
      "User",
      "Action",
      "Entity Type",
      "Details",
      "IP Address",
    ];
    const rows = logs.map((log) => [
      formatTimestamp(log.created_at),
      log.users?.full_name || "Unknown",
      log.action,
      log.entity_type || "-",
      log.details ? JSON.stringify(log.details) : "-",
      log.ip_address || "-",
    ]);

    const csvContent = [headers, ...rows]
      .map((row) =>
        row
          .map((cell) =>
            typeof cell === "string" && (cell.includes(",") || cell.includes('"') || cell.includes("\n"))
              ? `"${cell.replace(/"/g, '""')}"`
              : cell,
          )
          .join(","),
      )
      .join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `activity_logs_export_${today}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    const logData = logs.map((log) => ({
      userName: log.users?.full_name || "Unknown",
      action: log.action,
      entityType: log.entity_type || "",
      details: log.details as Record<string, unknown> | undefined,
      createdAt: log.created_at,
    }));
    const from = dateFrom ? ` from ${dateFrom}` : "";
    const to = dateTo ? ` to ${dateTo}` : "";
    generateActivityLogPDF(logData, `Activity Logs${from}${to}`);
  };

  const chartTabButtons = ["All", "Actions", "Equipment", "Users"] as const;

  const renderPieChart = (
    data: ActionCount[],
    title: string,
  ) => (
    <div className="ecp-card p-5">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-silver">
        {title}
      </h3>
      {loading && data.length === 0 ? (
        <div className="flex items-center justify-center py-8">
          <div className="flex flex-col items-center gap-4">
            <Skeleton className="h-[160px] w-[160px] rounded-full" />
            <div className="flex gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Skeleton className="h-3 w-3 rounded-sm" />
                  <Skeleton className="h-3 w-16" />
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : data.length === 0 ? (
        <div className="flex items-center justify-center py-12 text-sm text-silver">
          No data available
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={80}
              dataKey="value"
              label={({ name, value }) => `${name}: ${value}`}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );

  return (
    <div className="print:bg-white">
      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background: white !important;
          }
        }
      `}</style>

      <div className="mb-6 rounded-xl border border-[#dde4ec] bg-white p-4 shadow-sm no-print">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-xl font-bold text-navy">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-light text-teal">
              <ScrollText className="h-4 w-4" />
            </span>
            Activity Logs
          </h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              className="border-[#dde4ec]"
            >
              <Download className="mr-1 h-4 w-4" />
              Export CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="border-[#dde4ec]"
            >
              <Calendar className="mr-1 h-4 w-4" />
              Print
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPDF}
              className="border-[#dde4ec]"
            >
              <FileText className="mr-1 h-4 w-4" />
              PDF
            </Button>
          </div>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3 ecp-card p-4 no-print">
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold uppercase text-silver">
            From
          </label>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setPage(1);
            }}
            className="w-40 border-[#dde4ec] text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold uppercase text-silver">
            To
          </label>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              setPage(1);
            }}
            className="w-40 border-[#dde4ec] text-sm"
          />
        </div>
        <div className="relative flex items-center gap-2">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-silver" />
          <Input
            placeholder="Search action or description..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-56 border-[#dde4ec] pl-9 text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold uppercase text-silver">
            Action
          </label>
          <Select
            value={actionFilter}
            onValueChange={(v) => {
              setActionFilter(v ?? "All");
              setPage(1);
            }}
          >
            <SelectTrigger className="w-32 border-[#dde4ec] text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ACTION_TYPES.map((a) => (
                <SelectItem key={a} value={a}>
                  {a === "All" ? "All" : ACTION_VARIANTS[a]?.label || a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="no-print">
        <div className="mb-4 flex items-center gap-2">
          {chartTabButtons.map((tab) => (
            <button
              key={tab}
              onClick={() => setChartTab(tab)}
              className={`rounded-lg border px-4 py-2 text-sm font-semibold transition-all ${
                chartTab === tab
                  ? "border-teal bg-teal text-white"
                  : "border-[#dde4ec] bg-white text-silver hover:border-teal hover:text-teal"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {(chartTab === "All" || chartTab === "Actions") && (
          <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
            {renderPieChart(actionCounts, "Action Breakdown")}
            {chartTab === "Actions" ? (
              <>
                <div />
                <div />
              </>
            ) : null}
          </div>
        )}

        {(chartTab === "All" || chartTab === "Equipment") && (
          <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
            {renderPieChart(equipmentStatus, "Equipment Status")}
            {chartTab === "Equipment" ? (
              <>
                <div />
                <div />
              </>
            ) : null}
          </div>
        )}

        {(chartTab === "All" || chartTab === "Users") && (
          <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
            {renderPieChart(studentStatus, "Student Status")}
            {chartTab === "Users" ? (
              <>
                <div />
                <div />
              </>
            ) : null}
          </div>
        )}
      </div>

      <div className="ecp-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#dde4ec] bg-[#f8f9fa] text-xs font-semibold uppercase tracking-wider text-silver">
                <th className="w-10 px-4 py-3">#</th>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Entity Type</th>
                <th className="px-4 py-3">Details</th>
                <th className="px-4 py-3">IP Address</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-[#f0f0f0]">
                    <td className="px-4 py-3">
                      <Skeleton className="h-4 w-6" />
                    </td>
                    <td className="px-4 py-3">
                      <Skeleton className="h-4 w-36" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-7 w-7 rounded-full" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Skeleton className="h-5 w-20 rounded-full" />
                    </td>
                    <td className="px-4 py-3">
                      <Skeleton className="h-4 w-16" />
                    </td>
                    <td className="px-4 py-3">
                      <Skeleton className="h-4 w-40" />
                    </td>
                    <td className="px-4 py-3">
                      <Skeleton className="h-4 w-28" />
                    </td>
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-16 text-center"
                  >
                    <ScrollText className="mx-auto mb-3 h-10 w-10 text-silver/40" />
                    <p className="text-sm font-medium text-silver">
                      No activity logs found
                    </p>
                    <p className="mt-1 text-xs text-silver/60">
                      Adjust your filters or check back later
                    </p>
                  </td>
                </tr>
              ) : (
                logs.map((log, idx) => (
                  <tr
                    key={log.id}
                    className="border-b border-[#f0f0f0] hover:bg-[#f8f9fa]"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-silver">
                      {(page - 1) * PAGE_SIZE + idx + 1}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-silver">
                      {formatTimestamp(log.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-teal-light text-[11px] font-bold text-teal">
                          {getInitial(log.users?.full_name ?? null)}
                        </span>
                        <span className="font-medium text-navy">
                          {log.users?.full_name || "Unknown"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {getActionBadge(log.action)}
                    </td>
                    <td className="px-4 py-3 text-sm capitalize text-navy">
                      {log.entity_type
                        ? log.entity_type.replace(/_/g, " ")
                        : "-"}
                    </td>
                    <td className="max-w-[200px] truncate px-4 py-3 text-xs text-silver">
                      {formatDetails(log.details)}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-silver">
                      {log.ip_address || "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-[#dde4ec] px-4 py-3 no-print">
            <p className="text-xs text-silver">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, totalCount)} of{" "}
              {totalCount} entries
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="border-[#dde4ec] text-xs"
              >
                Previous
              </Button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }

                return (
                  <Button
                    key={pageNum}
                    variant={page === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPage(pageNum)}
                    className={
                      page === pageNum
                        ? "bg-teal text-white"
                        : "border-[#dde4ec] text-xs"
                    }
                  >
                    {pageNum}
                  </Button>
                );
              })}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="border-[#dde4ec] text-xs"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
