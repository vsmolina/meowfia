import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import { AdminNav } from "@/components/admin/admin-nav";
import { FileTag } from "@/components/brand/stamp";

export const metadata: Metadata = { title: { default: "Admin HQ", template: "%s · Admin HQ" }, robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const admin = await requireAdmin();
  const [pendingPosts, unfulfilled, newInquiries, openCommissions] = await Promise.all([
    db.galleryPost.count({ where: { status: "PENDING" } }),
    db.order.count({ where: { status: "PAID", fulfillmentStatus: { in: ["UNFULFILLED", "PROCESSING"] } } }),
    db.inquiry.count({ where: { status: "NEW" } }),
    db.commission.count({ where: { status: { in: ["DEPOSIT_PAID", "QUOTED", "ACCEPTED", "IN_PROGRESS"] } } }),
  ]);
  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6">
      <FileTag>Command center · {admin.email}</FileTag>
      <div className="mt-3 grid gap-6 lg:grid-cols-[200px_1fr]">
        <aside className="min-w-0 lg:sticky lg:top-20 lg:self-start">
          <AdminNav badges={{ "/admin/moderation": pendingPosts, "/admin/orders": unfulfilled, "/admin/inquiries": newInquiries, "/admin/commissions": openCommissions }} />
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
