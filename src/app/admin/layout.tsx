"use client";

import { AdminLayout } from "@/components/admin/admin-layout";
import { usePathname } from "next/navigation";

export default function AdminLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Login page renders without the admin layout wrapper (no auth check)
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return <AdminLayout>{children}</AdminLayout>;
}
