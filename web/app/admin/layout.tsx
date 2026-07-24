"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard,
  Microscope,
  Tags,
  HandHelping,
  GraduationCap,
  Users,
  ScrollText,
  Wrench,
  Megaphone,
  Settings,
} from "lucide-react";
import { AdminHeader } from "@/components/admin/header";

const navigation = [
  { title: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { title: "Equipment", href: "/admin/equipment", icon: Microscope },
  { title: "Categories", href: "/admin/categories", icon: Tags },
  { title: "Borrowings", href: "/admin/borrow-requests", icon: HandHelping },
  { title: "Students", href: "/admin/students", icon: GraduationCap },
  { title: "Faculty", href: "/admin/faculty", icon: Users },
  { title: "Logs & Reports", href: "/admin/activity-logs", icon: ScrollText },
  { title: "Maintenance", href: "/admin/maintenance", icon: Wrench },
  { title: "Announcements", href: "/admin/announcements", icon: Megaphone },
  { title: "Settings", href: "/admin/settings", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const supabase = createClient();
  const [userName, setUserName] = useState("Admin");

  useEffect(() => {
    const fetch = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from("users").select("full_name").eq("id", user.id).single();
        if (data?.full_name) setUserName(data.full_name);
      }
    };
    fetch();
  }, []);

  return (
    <div className="flex min-h-screen">
      <aside className="fixed left-0 top-0 z-30 flex h-screen w-[260px] flex-col bg-navy text-white">
        <div className="border-b border-white/10 px-5 py-6 text-center">
          <h3 className="text-[1.1rem] font-bold tracking-wide">ECP Inventory Lab</h3>
          <p className="mt-1 text-[0.7rem] text-white/70">Laboratory Management System</p>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-3">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group mb-[3px] flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all ${
                  isActive
                    ? "bg-teal/20 text-white"
                    : "text-white/80 hover:bg-teal/10 hover:text-white hover:pl-5"
                }`}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                <span className="whitespace-nowrap tracking-wide">{item.title}</span>
                {isActive && (
                  <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r bg-teal" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 bg-black/20 p-4">
          <div className="rounded-lg bg-white/10 p-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal text-sm font-bold">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">{userName}</p>
                <p className="text-[0.7rem] text-white/70">Administrator</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <div className="ml-[260px] flex flex-1 flex-col">
        <AdminHeader />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
