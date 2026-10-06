import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth-helpers";
import { signOutAction } from "@/actions/auth";
import { PageTitle } from "@/components/account/page-title";
import { Button } from "@/components/ui/button";
import { ProfileForm } from "./profile-form";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await requireUser("/account/settings");
  const profile = await db.user.findUniqueOrThrow({ where: { id: user.id }, select: { name: true, handle: true, bio: true, email: true } });
  return (
    <div className="space-y-10">
      <PageTitle eyebrow="Personnel record" title="Settings" />
      <ProfileForm defaults={{ name: profile.name ?? "", handle: profile.handle ?? "", bio: profile.bio ?? "" }} />
      <div className="max-w-lg space-y-3 border-t-2 border-dashed border-ink/30 pt-6">
        <p className="text-sm text-muted-foreground">
          Signed in as <b>{profile.email}</b>. To change your email or delete your account, contact us and we&apos;ll handle it within 48 hours.
        </p>
        <form action={signOutAction}>
          <Button type="submit" variant="outline">Sign out</Button>
        </form>
      </div>
    </div>
  );
}
