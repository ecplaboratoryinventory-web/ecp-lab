"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  Megaphone,
  Settings,
  TriangleAlert,
  Bell,
} from "lucide-react";
import { AdminHeader } from "@/components/admin/header";

const navigation = [
  { title: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { title: "Equipment", href: "/admin/equipment", icon: Microscope },
  { title: "Categories", href: "/admin/categories", icon: Tags },
  { title: "Borrowings", href: "/admin/borrow-requests", icon: HandHelping },
  { title: "Damage Reports", href: "/admin/damage-reports", icon: TriangleAlert },
  { title: "Students", href: "/admin/students", icon: GraduationCap },
  { title: "Faculty", href: "/admin/faculty", icon: Users },
  { title: "Notifications", href: "/admin/notifications", icon: Bell },
  { title: "Announcements", href: "/admin/announcements", icon: Megaphone },
  { title: "Logs & Reports", href: "/admin/activity-logs", icon: ScrollText },
  { title: "Settings", href: "/admin/settings", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/auth/login");
        return;
      }
      if (user) {
        const { data } = await supabase.from("users").select("role").eq("id", user.id).single();
        if (data?.role === "faculty") {
          router.replace("/faculty/dashboard");
          return;
        }
        if (data?.role === "student") {
          router.replace("/");
          return;
        }
      }
      setChecking(false);
    };
    fetch();
  }, [supabase, router]);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f2f5f9]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal border-t-transparent" />
      </div>
    );
  }

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
                className={`group relative mb-[3px] flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all ${
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
      </aside>

      <div className="ml-[260px] flex flex-1 flex-col">
        <AdminHeader />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
