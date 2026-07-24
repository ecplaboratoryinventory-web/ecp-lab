import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Package,
  Tags,
  ArrowRightLeft,
  Users,
  UserCheck,
  AlertTriangle,
  ScrollText,
  Wrench,
  Megaphone,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { AdminHeader } from "@/components/admin/header";

const navigation = [
  { title: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { title: "Equipment", href: "/admin/equipment", icon: Package },
  { title: "Categories", href: "/admin/categories", icon: Tags },
  { title: "Borrow Requests", href: "/admin/borrow-requests", icon: ArrowRightLeft },
  { title: "Students", href: "/admin/students", icon: Users },
  { title: "Faculty", href: "/admin/faculty", icon: UserCheck },
  { title: "Damage Reports", href: "/admin/damage-reports", icon: AlertTriangle },
  { title: "Activity Logs", href: "/admin/activity-logs", icon: ScrollText },
  { title: "Maintenance", href: "/admin/maintenance", icon: Wrench },
  { title: "Announcements", href: "/admin/announcements", icon: Megaphone },
  { title: "Settings", href: "/admin/settings", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar collapsible="icon">
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel className="text-base font-bold">ECP Lab</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigation.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        render={<Link href={item.href} />}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        <div className="flex flex-1 flex-col">
          <AdminHeader />
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
