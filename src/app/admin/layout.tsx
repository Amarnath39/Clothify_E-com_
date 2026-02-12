import type { Metadata } from "next";
import AdminShell from "@/components/admin/AdminShell";

export const metadata: Metadata = {
  manifest: "/manifest-admin.json",
  themeColor: "#7C1D3E",
  appleWebApp: {
    capable: true,
    title: "Admin Panel",
    statusBarStyle: "black-translucent",
  },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
