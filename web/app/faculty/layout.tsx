"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  LogOut,
  FlaskConical,
  Bell,
  ChevronDown,
  BellOff,
  CheckCheck,
} from "lucide-react";
import Link from "next/link";
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

export default function FacultyLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const supabase = createClient();
  const [userName, setUserName] = useState("");
  const [userDept, setUserDept] = useState("");
  const [checking, setChecking] = useState(true);
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

  useEffect(() => {
    const fetch = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/auth/login");
        return;
      }
      if (user) {
        const { data } = await supabase.from("users").select("full_name, department, role").eq("id", user.id).single();
        if (!data || (data.role !== "faculty" && data.role !== "teacher")) {
          router.replace("/auth/login");
          return;
        }
        setUserName(data?.full_name || "Faculty");
        setUserDept(data?.department || "");
      }
      setChecking(false);
    };
    fetch();
  }, []);

  const fetchNotifications = useCallback(async () => {
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData.user?.id;
    if (!userId) return;

    const { data } = await supabase
      .from("notifications")
      .select("id, title, message, is_read, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(8);

    setNotifications((data as NotifItem[]) || []);

    const { count } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_read", false);

    setUnreadCount(count || 0);
  }, []);

  useEffect(() => {
    if (!checking) fetchNotifications();
  }, [checking, fetchNotifications]);

  useEffect(() => {
    if (checking) return;
    const channel = supabase
      .channel("faculty-notifications")
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, () => fetchNotifications())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [checking, fetchNotifications]);

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

  const handleLogout = () => {
    withConfirm(async () => {
      await supabase.auth.signOut();
      router.push("/auth/login");
    });
  };

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f2f5f9]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-[#f2f5f9]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <style>{`
          *, *::before, *::after { box-sizing: border-box; }
          body { margin: 0; }
        `}</style>

        {/* Header — full width, no sidebar */}
        <header className="sticky top-0 z-30 flex h-[62px] items-center justify-between border-b border-[#dde4ec] bg-white px-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#0ea5a0]">
              <FlaskConical className="h-5 w-5 text-white" />
            </div>
            <div style={{ lineHeight: 1.2 }}>
              <strong className="block text-[0.95rem] font-bold tracking-tight text-[#1b2b40]">ECP Lab</strong>
              <span className="text-[0.62rem] text-[#8fa1b3]">Faculty Portal</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Notification Bell + Dropdown */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative rounded-full p-2 text-[#1b2b40] hover:bg-[#f0f0f0] transition-colors"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute right-0.5 top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 top-full mt-2 w-[360px] rounded-xl border border-[#dde4ec] bg-white shadow-xl z-50">
                  <div className="flex items-center justify-between border-b border-[#dde4ec] px-4 py-3">
                    <h4 className="m-0 text-sm font-bold text-[#1b2b40]">Notifications</h4>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="flex items-center gap-1 text-xs font-semibold text-[#0ea5a0] hover:underline"
                      >
                        <CheckCheck className="h-3 w-3" /> Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-[320px] overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="flex flex-col items-center py-8 text-center">
                        <BellOff className="h-8 w-8 text-[#8fa1b3]" />
                        <p className="mt-2 text-xs text-[#8fa1b3]">No notifications yet</p>
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`border-b border-[#f0f0f0] px-4 py-3 transition-colors hover:bg-[#f8fafb] ${
                            !n.is_read ? "bg-[#e0f7f6]/30" : ""
                          }`}
                        >
                          <p className={`text-xs ${!n.is_read ? "font-bold text-[#1b2b40]" : "font-medium text-[#4a5e74]"}`}>
                            {n.title}
                          </p>
                          {n.message && (
                            <p className="mt-0.5 text-[11px] text-[#8fa1b3] line-clamp-1">
                              {n.message.length > 60 ? n.message.slice(0, 60) + "..." : n.message}
                            </p>
                          )}
                          <p className="mt-1 text-[10px] text-[#8fa1b3]/70">{getRelativeTime(n.created_at)}</p>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="border-t border-[#dde4ec] px-4 py-2.5">
                    <Link
                      href="/notifications"
                      onClick={() => setNotifOpen(false)}
                      className="block text-center text-xs font-semibold text-[#0ea5a0] hover:underline"
                    >
                      View All Notifications
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* User info */}
            <div className="flex items-center gap-2.5 rounded-full border border-[#dde4ec] bg-white px-3 py-1.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0ea5a0] text-[0.85rem] font-bold text-white">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div style={{ lineHeight: 1.2 }}>
                <span className="block text-[0.8rem] font-semibold text-[#1b2b40]">{userName}</span>
                <span className="block text-[0.67rem] text-[#8fa1b3]">{userDept || "Faculty"}</span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-lg border border-[#dde4ec] px-3 py-1.5 text-xs font-semibold text-[#4a5e74] hover:border-red-300 hover:bg-red-50 hover:text-red-500 transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              Logout
            </button>
          </div>
        </header>

        {/* Main Content — full width */}
        <main className="p-6">{children}</main>
      </div>

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
