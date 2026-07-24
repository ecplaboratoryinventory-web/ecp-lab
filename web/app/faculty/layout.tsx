"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard,
  HandHelping,
  GraduationCap,
  User,
  LogOut,
  FlaskConical,
  Wrench,
} from "lucide-react";

export default function FacultyLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [userName, setUserName] = useState("");
  const [userDept, setUserDept] = useState("");

  useEffect(() => {
    const fetch = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from("users").select("full_name, department").eq("id", user.id).single();
        setUserName(data?.full_name || "Faculty");
        setUserDept(data?.department || "");
      }
    };
    fetch();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  const mainNav = [
    { title: "Dashboard", href: "/faculty/dashboard", icon: LayoutDashboard },
    { title: "Equipment", href: "/faculty/equipment", icon: FlaskConical },
    { title: "Borrow Item", href: "/faculty/borrow", icon: HandHelping },
    { title: "Student Borrows", href: "/faculty/approvals", icon: GraduationCap },
  ];

  const accountNav = [
    { title: "My Profile", href: "/faculty/profile", icon: User },
  ];

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        body { margin: 0; }
      `}</style>

      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-30 flex h-screen w-[268px] flex-col shadow-lg" style={{ background: "#1b2b40" }}>
        {/* Branding */}
        <div className="shrink-0 border-b border-white/[0.07] px-5 py-[18px]">
          <div className="mb-[18px] flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#0ea5a0]">
              <FlaskConical className="h-5 w-5 text-white" />
            </div>
            <div style={{ lineHeight: 1.2 }}>
              <strong className="block text-[23px] font-bold tracking-tight text-white">ECP Lab</strong>
              <span className="text-[0.67rem] text-white/50">Faculty Portal</span>
            </div>
          </div>

          {/* User info */}
          <div className="flex items-center gap-3 rounded-lg bg-white/[0.06] p-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0ea5a0] text-sm font-bold text-white">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1" style={{ lineHeight: 1.3 }}>
              <div className="truncate text-[0.82rem] font-semibold text-white">{userName}</div>
              <div className="text-[0.67rem] text-white/50">{userDept || "Faculty"}</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-4 py-3">
          <div className="mb-2 px-2.5 text-[0.62rem] font-bold uppercase tracking-[0.08em] text-white/30">Main Menu</div>
          {mainNav.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <div key={item.href} className="mb-[3px]">
                <Link
                  href={item.href}
                  className={`flex items-center gap-2.5 rounded-lg px-3.5 py-2.5 text-[0.85rem] font-medium tracking-wide no-underline transition-all ${
                    active
                      ? "bg-white/[0.08] text-white shadow-sm"
                      : "text-white/65 hover:bg-white/[0.05] hover:text-white hover:pl-4"
                  }`}
                >
                  <item.icon className="h-[18px] w-[18px] shrink-0" />
                  <span>{item.title}</span>
                </Link>
              </div>
            );
          })}

          <div className="my-3 h-px bg-white/[0.06]" />
          <div className="mb-2 px-2.5 text-[0.62rem] font-bold uppercase tracking-[0.08em] text-white/30">Account</div>
          {accountNav.map((item) => {
            const active = pathname === item.href;
            return (
              <div key={item.href} className="mb-[3px]">
                <Link
                  href={item.href}
                  className={`flex items-center gap-2.5 rounded-lg px-3.5 py-2.5 text-[0.85rem] font-medium tracking-wide no-underline transition-all ${
                    active
                      ? "bg-white/[0.08] text-white shadow-sm"
                      : "text-white/65 hover:bg-white/[0.05] hover:text-white hover:pl-4"
                  }`}
                >
                  <item.icon className="h-[18px] w-[18px] shrink-0" />
                  <span>{item.title}</span>
                </Link>
              </div>
            );
          })}

          <div className="mb-[3px]">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2.5 rounded-lg px-3.5 py-2.5 text-[0.85rem] font-medium tracking-wide text-white/50 no-underline transition-all hover:bg-red-500/10 hover:text-red-400"
            >
              <LogOut className="h-[18px] w-[18px] shrink-0" />
              <span>Logout</span>
            </button>
          </div>
        </nav>

        {/* Footer */}
        <div className="shrink-0 px-4 py-3 text-center text-[0.65rem] text-white/20">
          ECP Lab v2.0 · {new Date().getFullYear()}
        </div>
      </aside>

      {/* Main Content */}
      <div className="ml-[268px] flex min-h-screen flex-col bg-[#f2f5f9]">
        {/* Topbar */}
        <header className="sticky top-0 z-20 flex h-[62px] items-center justify-between border-b border-[#dde4ec] bg-white px-6 shadow-sm">
          <h4 className="m-0 text-base font-bold text-[#1b2b40]">
            {mainNav.find((n) => pathname.startsWith(n.href))?.title || "Faculty Portal"}
          </h4>
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-2.5 rounded-full border border-[#dde4ec] bg-white px-3 py-1.5 transition-colors hover:border-[#0ea5a0] hover:bg-[#e0f7f6]">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0ea5a0] text-[0.85rem] font-bold text-white">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div style={{ lineHeight: 1.2 }}>
                <span className="block text-[0.8rem] font-semibold text-[#1b2b40]">{userName}</span>
                <span className="block text-[0.67rem] text-[#8fa1b3]">{userDept || "Faculty"}</span>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
