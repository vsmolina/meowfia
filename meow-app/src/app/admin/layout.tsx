import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth-helpers";

export const metadata: Metadata = { title: { default: "Admin HQ", template: "%s · Admin HQ" }, robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  await requireAdmin();
  return <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</div>;
}
