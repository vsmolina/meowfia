import type { Metadata } from "next";
import { requireUser } from "@/lib/auth-helpers";
import { AccountNav } from "@/components/account/account-nav";
import { FileTag } from "@/components/brand/stamp";

export const metadata: Metadata = { title: { default: "My Dossier", template: "%s · My Dossier" }, robots: { index: false } };

export default async function AccountLayout({ children }: LayoutProps<"/account">) {
  const user = await requireUser("/account");
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-12">
      <div className="mb-6">
        <FileTag>Personnel file · {user.email}</FileTag>
      </div>
      <div className="grid gap-8 lg:grid-cols-[200px_1fr]">
        <aside className="min-w-0 lg:sticky lg:top-24 lg:self-start">
          <AccountNav />
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
