import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User } from "lucide-react";
import { LogoutButton } from "@/components/shared/logout-button";

export default function FacultyLayout({ children }: { children: React.ReactNode }) {
  const links = [
    { title: "Dashboard", href: "/faculty/dashboard" },
    { title: "Borrow", href: "/faculty/borrow" },
    { title: "Equipment", href: "/faculty/equipment" },
    { title: "Approvals", href: "/faculty/approvals" },
    { title: "Schedule", href: "/faculty/schedule" },
    { title: "History", href: "/faculty/history" },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-14 items-center justify-between border-b border-zinc-200 px-6">
        <div className="flex items-center gap-6">
          <Link href="/faculty/dashboard" className="text-lg font-bold text-zinc-900">
            ECP Lab
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-md px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
              >
                {link.title}
              </Link>
            ))}
          </nav>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm hover:bg-zinc-100">
            <User className="h-4 w-4" />
            Faculty
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>
              <LogoutButton />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
