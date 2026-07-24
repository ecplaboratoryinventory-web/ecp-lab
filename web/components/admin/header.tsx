"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, ChevronDown, LogOut, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function AdminHeader() {
  const router = useRouter();
  const [name, setName] = useState("Administrator");
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from("users").select("full_name").eq("id", user.id).single();
        if (data?.full_name) setName(data.full_name);
        const { count } = await supabase.from("notifications").select("*", { count: "exact", head: true }).eq("is_read", false);
        if (count) setUnreadCount(count);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-[#dde4ec] bg-white px-6 shadow-sm">
      <div>
        <h1 className="text-xl font-semibold text-navy">Dashboard</h1>
      </div>

      <div className="flex items-center gap-3">
        <button className="relative rounded-full p-2 text-navy hover:bg-[#f0f0f0]">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-0 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>

        <div className="group relative">
          <button className="flex items-center gap-2 text-sm font-semibold text-navy">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal text-sm font-bold text-white">
              {name.charAt(0).toUpperCase()}
            </div>
            <span className="hidden sm:inline">{name}</span>
            <ChevronDown className="hidden h-3 w-3 sm:block" />
          </button>

          <div className="invisible absolute right-0 top-full mt-2 w-48 rounded-lg border border-[#dde4ec] bg-white shadow-lg opacity-0 transition-all group-hover:visible group-hover:opacity-100">
            <a href="/admin/settings" className="flex items-center gap-2 px-4 py-2.5 text-sm text-navy hover:bg-[#f8f9fa]">
              <User className="h-4 w-4" /> Profile
            </a>
            <button onClick={handleLogout} className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-[#f8f9fa]">
              <LogOut className="h-4 w-4" /> Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
