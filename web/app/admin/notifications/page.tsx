"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import {
  Bell,
  AlertTriangle,
  Info,
  Megaphone,
  BellOff,
  Trash2,
  CheckCheck,
  ChevronLeft,
} from "lucide-react";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  borrow_status: { icon: Bell, color: "#3b82f6", bg: "#3b82f615" },
  damage_report: { icon: AlertTriangle, color: "#ef4444", bg: "#ef444415" },
  system: { icon: Info, color: "#6b7280", bg: "#6b728015" },
  announcement: { icon: Megaphone, color: "#0ea5a0", bg: "#0ea5a015" },
};

function getRelativeTime(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMs < 60000) return "Just now";
  if (diffMin === 1) return "1 min ago";
  if (diffMin < 60) return `${diffMin} mins ago`;
  if (diffHrs === 1) return "1 hour ago";
  if (diffHrs < 24) return `${diffHrs} hours ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function NotificationsPage() {
  const supabase = createClient();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);

    const { data: authData } = await supabase.auth.getUser();
    const userId = authData.user?.id;
    if (!userId) {
      setLoading(false);
      return;
    }

    const { data, count } = await supabase
      .from("notifications")
      .select("*", { count: "exact" })
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (data) {
      setNotifications(data as Notification[]);
    } else {
      setNotifications([]);
    }
    setTotalCount(count || 0);

    const { count: unread } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_read", false);

    setUnreadCount(unread || 0);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    const channel = supabase
      .channel('admin-notifications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => fetchNotifications())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleMarkAsRead = async (id: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    fetchNotifications();
  };

  const handleMarkAllRead = async () => {
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData.user?.id;
    if (!userId) return;

    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false);

    fetchNotifications();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("notifications").delete().eq("id", id);
    fetchNotifications();
  };

  return (
    <div>
      <div className="mb-6 rounded-xl border border-[#dde4ec] bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-bold text-navy">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-light text-teal">
                <Bell className="h-4 w-4" />
              </span>
              Notifications
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/admin/dashboard">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 border-[#dde4ec] text-silver"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Back to Dashboard
              </Button>
            </Link>
            {unreadCount > 0 && (
              <Button
                size="sm"
                onClick={handleMarkAllRead}
                className="gap-1.5 bg-teal hover:bg-teal-dark"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark All Read
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="ecp-card overflow-hidden">
        {loading ? (
          <div className="divide-y divide-[#f0f0f0]">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-start gap-4 p-4">
                <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#f0f0f0]">
              <BellOff className="h-8 w-8 text-silver" />
            </div>
            <p className="mt-4 text-sm font-medium text-silver">
              No notifications yet
            </p>
            <p className="mt-1 text-xs text-silver/60">
              You&apos;re all caught up! New notifications will appear here.
            </p>
            <Link href="/admin/dashboard" className="mt-4">
              <Button
                variant="outline"
                size="sm"
                className="border-[#dde4ec] text-silver"
              >
                <ChevronLeft className="mr-1 h-3.5 w-3.5" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-[#f0f0f0]">
            {notifications.map((n) => {
              const typeCfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.system;
              const IconComponent = typeCfg.icon;

              return (
                <div
                  key={n.id}
                  className={`group relative flex items-start gap-4 p-4 transition-colors cursor-pointer ${
                    n.is_read
                      ? "bg-white opacity-60 hover:opacity-80"
                      : "border-l-[3px] border-l-teal bg-teal-light/30"
                  }`}
                  onClick={() => {
                    if (!n.is_read) handleMarkAsRead(n.id);
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !n.is_read) handleMarkAsRead(n.id);
                  }}
                >
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: typeCfg.bg }}
                  >
                    <IconComponent
                      className="h-5 w-5"
                      style={{ color: typeCfg.color }}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-sm ${
                        n.is_read
                          ? "font-medium text-slate"
                          : "font-bold text-navy"
                      }`}
                    >
                      {n.title}
                    </p>
                    {n.message && (
                      <p className="mt-0.5 text-xs text-silver line-clamp-1">
                        {n.message.length > 80
                          ? n.message.slice(0, 80) + "..."
                          : n.message}
                      </p>
                    )}
                    <p className="mt-1 text-[11px] text-silver/70">
                      {getRelativeTime(n.created_at)}
                    </p>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(n.id);
                    }}
                    className="shrink-0 rounded p-1.5 text-silver opacity-0 transition-opacity hover:bg-red-50 hover:text-red-400 group-hover:opacity-100"
                    title="Delete notification"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {!loading && notifications.length > 0 && (
          <div className="border-t border-[#dde4ec] bg-[#f8f9fa] px-4 py-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-silver">
                Total: <span className="font-semibold text-navy">{totalCount}</span>{" "}
                {totalCount === 1 ? "notification" : "notifications"}
              </p>
              <p className="text-xs text-silver">
                Unread:{" "}
                <span className="font-semibold text-teal">{unreadCount}</span>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
