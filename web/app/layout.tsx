import type { Metadata } from "next";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/shared/toast";
import ServiceWorkerRegister from "@/components/service-worker-register";
import "./globals.css";

export const metadata: Metadata = {
  title: "ECP Lab — Laboratory Inventory Management",
  description:
    "Engineering Laboratory Inventory Management System for STI College Cotabato",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#f2f5f9] font-sans antialiased">
        <TooltipProvider>{children}</TooltipProvider>
        <ServiceWorkerRegister />
        <Toaster />
      </body>
    </html>
  );
}
