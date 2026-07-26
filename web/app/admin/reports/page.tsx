"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/shared/toast";
import { generateMonthlyReport } from "@/lib/pdf";
import { BarChart3, FileText, Download, Calendar, TrendingUp, Package } from "lucide-react";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

interface ReportData {
  title: string;
  month: string;
  year: number;
  stats: {
    totalBorrows: number;
    totalReturns: number;
    totalBorrowed: number;
    totalApproved: number;
    totalPending: number;
  };
  equipmentSummary: { label: string; count: number }[];
  recentBorrows: {
    requestId: string;
    user: string;
    purpose: string;
    status: string;
    borrowDate: string;
    returnDate: string;
    itemsSummary: string;
  }[];
}

export default function ReportsPage() {
  const supabase = createClient();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ReportData | null>(null);

  const fetchReport = async (m: number, y: number) => {
    setLoading(true);
    const res = await fetch(`/api/reports/monthly?month=${m}&year=${y}`);
    if (res.ok) {
      const json = await res.json();
      setData(json);
    } else {
      toast({ title: "Error", description: "Failed to load report data.", variant: "error" });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchReport(month, year);
  }, [month, year]);

  const handleDownloadPDF = () => {
    if (!data) return;
    generateMonthlyReport(data);
  };

  const years = [];
  for (let y = now.getFullYear(); y >= 2024; y--) years.push(y);

  return (
    <div>
      <div className="mb-6 rounded-xl border border-[#dde4ec] bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-xl font-bold text-navy">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-light text-teal">
              <BarChart3 className="h-4 w-4" />
            </span>
            Monthly Reports
          </h2>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Select value={String(month)} onValueChange={(v) => v && setMonth(parseInt(v))}>
                <SelectTrigger className="w-32 border-[#dde4ec]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m, i) => (
                    <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={String(year)} onValueChange={(v) => v && setYear(parseInt(v))}>
                <SelectTrigger className="w-24 border-[#dde4ec]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((y) => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              size="sm"
              onClick={handleDownloadPDF}
              disabled={!data}
              className="gap-1.5 bg-teal hover:bg-teal-dark"
            >
              <FileText className="h-3.5 w-3.5" /> Download PDF
            </Button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      ) : data ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {[
              { label: "Total Borrows", value: data.stats.totalBorrows, icon: TrendingUp, color: "#0ea5a0" },
              { label: "Returns", value: data.stats.totalReturns, icon: Package, color: "#10b981" },
              { label: "Currently Borrowed", value: data.stats.totalBorrowed, icon: Calendar, color: "#3b82f6" },
              { label: "Approved", value: data.stats.totalApproved, icon: TrendingUp, color: "#8b5cf6" },
              { label: "Pending", value: data.stats.totalPending, icon: Calendar, color: "#f59e0b" },
            ].map((s) => (
              <Card key={s.label} className="border-[#dde4ec] p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-silver">{s.label}</p>
                    <p className="mt-1 text-2xl font-bold text-navy">{s.value}</p>
                  </div>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: s.color + "15" }}>
                    <s.icon className="h-4 w-4" style={{ color: s.color }} />
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <Card className="border-[#dde4ec] p-5">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-silver">Equipment Status</h3>
            <div className="overflow-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#dde4ec] text-xs font-semibold uppercase text-silver">
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2 text-right">Count</th>
                  </tr>
                </thead>
                <tbody>
                  {data.equipmentSummary.map((eq) => (
                    <tr key={eq.label} className="border-b border-[#f0f0f0]">
                      <td className="px-4 py-2.5 font-medium text-navy">{eq.label}</td>
                      <td className="px-4 py-2.5 text-right font-bold text-navy">{eq.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="border-[#dde4ec] p-5">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-silver">
              Recent Borrow Requests ({data.recentBorrows.length})
            </h3>
            <div className="overflow-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#dde4ec] text-xs font-semibold uppercase text-silver">
                    <th className="px-3 py-2">ID</th>
                    <th className="px-3 py-2">User</th>
                    <th className="px-3 py-2">Purpose</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Borrow Date</th>
                    <th className="px-3 py-2">Return Date</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentBorrows.map((b) => (
                    <tr key={b.requestId} className="border-b border-[#f0f0f0]">
                      <td className="px-3 py-2 font-mono text-xs text-silver">{b.requestId}</td>
                      <td className="px-3 py-2 font-medium text-navy">{b.user}</td>
                      <td className="px-3 py-2 text-silver">{b.purpose.length > 40 ? b.purpose.slice(0, 40) + "…" : b.purpose}</td>
                      <td className="px-3 py-2">
                        <Badge className={
                          b.status === "approved" ? "bg-green-100 text-green-700" :
                          b.status === "pending" ? "bg-amber-100 text-amber-700" :
                          b.status === "returned" ? "bg-blue-100 text-blue-700" :
                          "bg-red-100 text-red-700"
                        }>{b.status}</Badge>
                      </td>
                      <td className="px-3 py-2 text-silver">{b.borrowDate}</td>
                      <td className="px-3 py-2 text-silver">{b.returnDate}</td>
                    </tr>
                  ))}
                  {data.recentBorrows.length === 0 && (
                    <tr><td colSpan={6} className="px-3 py-8 text-center text-silver">No borrow requests this month.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      ) : (
        <div className="py-12 text-center text-silver">No report data available for this period.</div>
      )}
    </div>
  );
}
