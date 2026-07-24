"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  PackageCheck,
  Clock,
  Calendar,
  ArrowRight,
  Bell,
} from "lucide-react";
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

const COLORS: Record<string, string> = {
  pending: "#f59e0b",
  approved: "#3b82f6",
  borrowed: "#0ea5a0",
  returned: "#10b981",
  denied: "#ef4444",
  rejected: "#ef4444",
};

function getStatusColor(status: string): string {
  return COLORS[status] ?? "#8fa1b3";
}

const TODAY_LABEL = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
][new Date().getDay()];

interface StatCard {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
}

interface BorrowChartItem {
  status: string;
  count: number;
}

interface CurrentBorrow {
  id: string;
  equipment: string;
  borrowDate: string;
  expectedReturn: string;
  status: string;
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  created_at: string;
  is_read: boolean;
}

interface ScheduleItem {
  id: string;
  subject: string;
  room: string;
  start_time: string;
  end_time: string;
}

export default function FacultyDashboardPage() {
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState<StatCard[]>([
    { label: "Active Borrows", value: 0, icon: PackageCheck, color: "#0ea5a0" },
    { label: "Pending Approvals", value: 0, icon: Clock, color: "#f59e0b" },
    { label: "Today's Classes", value: 0, icon: Calendar, color: "#3b82f6" },
  ]);

  const [borrowChart, setBorrowChart] = useState<BorrowChartItem[]>([]);
  const [currentBorrows, setCurrentBorrows] = useState<CurrentBorrow[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [nextClass, setNextClass] = useState<ScheduleItem | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const userId = user.id;

      const { data: userData } = await supabase
        .from("users")
        .select("full_name")
        .eq("id", userId)
        .single();

      if (userData) {
        setFullName(userData.full_name ?? "");
      }

      const { count: activeBorrows } = await supabase
        .from("borrow_requests")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("status", "borrowed");

      const { count: pendingApprovals } = await supabase
        .from("borrow_requests")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending")
        .eq("request_type", "student");

      const { count: todayClasses } = await supabase
        .from("class_schedules")
        .select("*", { count: "exact", head: true })
        .eq("faculty_id", userId)
        .eq("day_of_week", TODAY_LABEL);

      setStats([
        { label: "Active Borrows", value: activeBorrows ?? 0, icon: PackageCheck, color: "#0ea5a0" },
        { label: "Pending Approvals", value: pendingApprovals ?? 0, icon: Clock, color: "#f59e0b" },
        { label: "Today's Classes", value: todayClasses ?? 0, icon: Calendar, color: "#3b82f6" },
      ]);

      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const { data: monthBorrows } = await supabase
        .from("borrow_requests")
        .select("status")
        .eq("user_id", userId)
        .gte("created_at", monthStart);

      if (monthBorrows) {
        const grouped: Record<string, number> = {};
        monthBorrows.forEach((b) => {
          grouped[b.status] = (grouped[b.status] || 0) + 1;
        });
        const chartData: BorrowChartItem[] = Object.entries(grouped).map(([status, count]) => ({
          status: status.charAt(0).toUpperCase() + status.slice(1),
          count,
        }));
        setBorrowChart(chartData);
      }

      const { data: activeBorrowData } = await supabase
        .from("borrow_requests")
        .select("id, borrow_date, return_date, status")
        .eq("user_id", userId)
        .eq("status", "borrowed")
        .order("created_at", { ascending: false });

      if (activeBorrowData && activeBorrowData.length > 0) {
        const borrowIds = activeBorrowData.map((b) => b.id);

        const { data: items } = await supabase
          .from("borrow_items")
          .select("borrow_request_id, equipment_id")
          .in("borrow_request_id", borrowIds);

        const equipIds = items ? [...new Set(items.map((i) => i.equipment_id))] : [];

        const { data: equipData } =
          equipIds.length > 0
            ? await supabase.from("equipment").select("id, name").in("id", equipIds)
            : { data: [] };

        const equipMap: Record<string, string> = {};
        equipData?.forEach((e) => {
          equipMap[e.id] = e.name;
        });

        const borrowItemMap: Record<string, string[]> = {};
        items?.forEach((i) => {
          if (!borrowItemMap[i.borrow_request_id]) borrowItemMap[i.borrow_request_id] = [];
          const name = equipMap[i.equipment_id];
          if (name) borrowItemMap[i.borrow_request_id].push(name);
        });

        const borrows: CurrentBorrow[] = activeBorrowData.map((b) => ({
          id: b.id,
          equipment: (borrowItemMap[b.id] || []).join(", ") || "-",
          borrowDate: b.borrow_date
            ? new Date(b.borrow_date + "T00:00:00").toLocaleDateString()
            : "-",
          expectedReturn: b.return_date
            ? new Date(b.return_date + "T00:00:00").toLocaleDateString()
            : "-",
          status: b.status,
        }));
        setCurrentBorrows(borrows);
      }

      const { data: notifData } = await supabase
        .from("notifications")
        .select("id, title, message, type, created_at, is_read")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(5);

      if (notifData) {
        setNotifications(notifData as NotificationItem[]);
      }

      const { data: scheduleData } = await supabase
        .from("class_schedules")
        .select("id, subject, room, start_time, end_time")
        .eq("faculty_id", userId)
        .eq("day_of_week", TODAY_LABEL)
        .order("start_time", { ascending: true })
        .limit(1)
        .single();

      if (scheduleData) {
        setNextClass(scheduleData as ScheduleItem);
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  const StatCardSkeleton = () => (
    <div className="ecp-stat-card">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <Skeleton className="mb-2 h-4 w-24" />
          <Skeleton className="h-8 w-16" />
        </div>
        <Skeleton className="h-10 w-10 rounded-lg" />
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-full rounded-xl" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Skeleton className="h-[300px] rounded-xl lg:col-span-2" />
          <Skeleton className="h-[300px] rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[#dde4ec] bg-gradient-to-r from-navy to-[#253348] p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-white">
          Welcome back, {fullName || "Faculty"}
        </h1>
        <p className="mt-1 text-sm text-white/70">
          Here&apos;s your laboratory overview for today.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="ecp-stat-card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-silver">{stat.label}</p>
                <p className="mt-1 text-3xl font-bold text-navy">{stat.value}</p>
              </div>
              <div
                className="flex h-10 w-10 items-center justify-center rounded-lg"
                style={{ backgroundColor: stat.color + "15" }}
              >
                <stat.icon className="h-5 w-5" style={{ color: stat.color }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/faculty/borrow">
          <Button
            className="bg-teal hover:bg-teal-dark text-white gap-2 h-10 px-5"
          >
            <PackageCheck className="h-4 w-4" />
            Borrow Equipment
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
        <Link href="/faculty/approvals">
          <Button
            variant="outline"
            className="border-teal text-teal hover:bg-teal-light gap-2 h-10 px-5"
          >
            <Clock className="h-4 w-4" />
            Approve Requests
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="ecp-card lg:col-span-2 border-0 shadow-none">
          <CardHeader>
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-silver">
              My Borrows This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            {borrowChart.length === 0 ? (
              <div className="flex h-[250px] items-center justify-center text-sm text-silver">
                No borrows this month
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={borrowChart} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#dde4ec" />
                  <XAxis dataKey="status" tick={{ fontSize: 11, fill: "#8fa1b3" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#8fa1b3" }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid #dde4ec",
                      fontSize: "13px",
                    }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {borrowChart.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={getStatusColor(entry.status.toLowerCase())}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="ecp-card border-0 shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-silver">
              <Bell className="h-4 w-4" />
              Recent Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            {notifications.length === 0 ? (
              <p className="py-8 text-center text-sm text-silver">
                No notifications yet
              </p>
            ) : (
              <div className="space-y-3">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`rounded-lg border p-3 text-sm ${
                      n.is_read
                        ? "border-[#dde4ec] bg-white"
                        : "border-teal/30 bg-teal-light/50"
                    }`}
                  >
                    <p className="font-semibold text-navy">{n.title}</p>
                    {n.message && (
                      <p className="mt-0.5 text-xs text-silver line-clamp-2">
                        {n.message}
                      </p>
                    )}
                    <p className="mt-1 text-[11px] text-silver/70">
                      {new Date(n.created_at).toLocaleDateString()} ·{" "}
                      {new Date(n.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="ecp-card lg:col-span-2 border-0 shadow-none">
          <CardHeader>
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-silver">
              Current Borrows
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-silver">
                    Equipment
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-silver">
                    Borrow Date
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-silver">
                    Expected Return
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-silver">
                    Status
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentBorrows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8 text-center text-silver">
                      No active borrows
                    </TableCell>
                  </TableRow>
                ) : (
                  currentBorrows.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell className="font-medium text-navy">
                        {b.equipment}
                      </TableCell>
                      <TableCell className="text-slate">{b.borrowDate}</TableCell>
                      <TableCell className="text-slate">{b.expectedReturn}</TableCell>
                      <TableCell>
                        <Badge
                          variant="default"
                          className="bg-teal/15 text-teal hover:bg-teal/20 text-[11px] font-semibold uppercase"
                        >
                          {b.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="ecp-card border-0 shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-silver">
              <Calendar className="h-4 w-4" />
              Today&apos;s Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            {nextClass ? (
              <div className="rounded-lg border border-teal/30 bg-teal-light/50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-teal/70">
                  {TODAY_LABEL}
                </p>
                <p className="mt-1 text-lg font-bold text-navy">
                  {nextClass.subject || "Untitled Class"}
                </p>
                <div className="mt-2 space-y-1 text-sm text-slate">
                  <p>
                    <span className="text-silver">Time:</span>{" "}
                    {nextClass.start_time?.slice(0, 5) ?? "-"} &mdash;{" "}
                    {nextClass.end_time?.slice(0, 5) ?? "-"}
                  </p>
                  <p>
                    <span className="text-silver">Room:</span>{" "}
                    {nextClass.room || "-"}
                  </p>
                </div>
                <Link
                  href="/faculty/schedule"
                  className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-teal hover:text-teal-dark"
                >
                  View full schedule <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            ) : (
              <div className="rounded-lg border border-[#dde4ec] bg-[#f8f9fa] p-4 text-center">
                <Calendar className="mx-auto h-8 w-8 text-silver/40" />
                <p className="mt-2 text-sm text-silver">
                  No classes scheduled for today
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
