"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bell, ChevronDown, LogOut, User, BellOff, CheckCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";

interface NotifItem {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

function getRelativeTime(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMs < 60000) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHrs < 24) return `${diffHrs}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function FacultyHeader({ title = "Dashboard" }: { title?: string }) {
  const router = useRouter();
  const [name, setName] = useState("Faculty");
  const [dept, setDept] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotifItem[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);

  const withConfirm = (action: () => void) => {
    setConfirmAction(() => action);
    setConfirmOpen(true);
  };

  const fetchNotifications = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from("users").select("full_name, department").eq("id", user.id).single();
      if (data?.full_name) setName(data.full_name);
      if (data?.department) setDept(data.department);

      const { data: notifs } = await supabase
        .from("notifications")
        .select("id, title, message, is_read, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(8);

      setNotifications((notifs as NotifItem[]) || []);

      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_read", false);

      setUnreadCount(count || 0);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("faculty-header-notifications")
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, () => fetchNotifications())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchNotifications]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false);
    fetchNotifications();
  };

  const handleLogout = () => {
    withConfirm(async () => {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/auth/login");
    });
  };

  return (
    <>
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-[#dde4ec] bg-white px-6 shadow-sm">
        <div>
          <h1 className="text-xl font-semibold text-navy">{title}</h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Notification Bell + Dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="relative rounded-full p-2 text-navy hover:bg-[#f0f0f0] transition-colors"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute right-1 top-0 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 top-full mt-2 w-[360px] rounded-xl border border-[#dde4ec] bg-white shadow-xl z-50">
                <div className="flex items-center justify-between border-b border-[#dde4ec] px-4 py-3">
                  <h4 className="m-0 text-sm font-bold text-navy">Notifications</h4>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="flex items-center gap-1 text-xs font-semibold text-teal hover:underline"
                    >
                      <CheckCheck className="h-3 w-3" /> Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-[320px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="flex flex-col items-center py-8 text-center">
                      <BellOff className="h-8 w-8 text-silver" />
                      <p className="mt-2 text-xs text-silver">No notifications yet</p>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`border-b border-[#f0f0f0] px-4 py-3 transition-colors hover:bg-[#f8fafb] ${
                          !n.is_read ? "bg-teal-light/30" : ""
                        }`}
                      >
                        <p className={`text-xs ${!n.is_read ? "font-bold text-navy" : "font-medium text-slate"}`}>
                          {n.title}
                        </p>
                        {n.message && (
                          <p className="mt-0.5 text-[11px] text-silver line-clamp-1">
                            {n.message.length > 60 ? n.message.slice(0, 60) + "..." : n.message}
                          </p>
                        )}
                        <p className="mt-1 text-[10px] text-silver/70">{getRelativeTime(n.created_at)}</p>
                      </div>
                    ))
                  )}
                </div>
                <div className="border-t border-[#dde4ec] px-4 py-2.5">
                  <Link
                    href="/faculty/notifications"
                    onClick={() => setNotifOpen(false)}
                    className="block text-center text-xs font-semibold text-teal hover:underline"
                  >
                    View All Notifications
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* User dropdown */}
          <div className="group relative">
            <button className="flex items-center gap-2 text-sm font-semibold text-navy">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal text-sm font-bold text-white">
                {name.charAt(0).toUpperCase()}
              </div>
              <span className="hidden sm:inline">{name}</span>
              <ChevronDown className="hidden h-3 w-3 sm:block" />
            </button>

            <div className="invisible absolute right-0 top-full mt-2 w-48 rounded-lg border border-[#dde4ec] bg-white shadow-lg opacity-0 transition-all group-hover:visible group-hover:opacity-100">
              <div className="border-b border-[#dde4ec] px-4 py-2.5">
                <p className="truncate text-sm font-semibold text-navy">{name}</p>
                <p className="text-[0.7rem] text-silver">{dept || "Faculty"}</p>
              </div>
              <a href="/faculty/profile" className="flex items-center gap-2 px-4 py-2.5 text-sm text-navy hover:bg-[#f8f9fa]">
                <User className="h-4 w-4" /> Profile
              </a>
              <button onClick={handleLogout} className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-[#f8f9fa]">
                <LogOut className="h-4 w-4" /> Logout
              </button>
            </div>
          </div>
        </div>
      </header>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Logout?"
        description="Are you sure you want to logout?"
        confirmLabel="Logout"
        variant="danger"
        onConfirm={() => { confirmAction?.(); setConfirmOpen(false); }}
      />
    </>
  );
}
