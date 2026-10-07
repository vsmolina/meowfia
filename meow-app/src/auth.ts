import NextAuth, { type DefaultSession } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { env, features, adminEmails } from "@/lib/env";
import { sendEmail } from "@/lib/email";
import { claimGuestRecords } from "@/lib/entitlements";
import { MagicLinkEmail } from "@/emails/magic-link";
import { REF_COOKIE } from "@/lib/referral-cookie";
import { siteConfig } from "@/config/site";

declare module "next-auth" {
  interface Session {
    user: { id: string; role: "USER" | "ADMIN"; handle: string | null } & DefaultSession["user"];
  }
  interface User {
    role?: "USER" | "ADMIN";
    handle?: string | null;
  }
}

/**
 * Auth.js v5 with database sessions.
 *  - Email magic links: sent through our email layer (console-logged without RESEND_API_KEY)
 *  - Google: enabled only when AUTH_GOOGLE_ID/SECRET are set
 *  - Anyone in ADMIN_EMAILS is promoted to ADMIN on sign-in (or use `npm run make-admin`)
 */
// The generated Prisma 7 client is structurally compatible with the adapter's expected client
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const baseAdapter = PrismaAdapter(db as any);
const adapter: typeof baseAdapter = {
  ...baseAdapter,
  // A stale cookie can point at a session row that's already gone (expired, signed out
  // elsewhere, DB reset). The stock adapter throws P2025 there, which breaks sign-in.
  async deleteSession(sessionToken) {
    try {
      await baseAdapter.deleteSession!(sessionToken);
    } catch (e) {
      if ((e as { code?: string }).code !== "P2025") throw e;
    }
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter,
  secret: env.AUTH_SECRET ?? (env.NODE_ENV !== "production" ? "dev-only-insecure-auth-secret-change-me" : undefined),
  trustHost: true,
  session: { strategy: "database", maxAge: 60 * 60 * 24 * 30 },
  pages: { signIn: "/sign-in", verifyRequest: "/sign-in/check-email", error: "/sign-in" },
  providers: [
    Resend({
      apiKey: env.RESEND_API_KEY ?? "console",
      from: env.EMAIL_FROM ?? `${siteConfig.name} <onboarding@resend.dev>`,
      maxAge: 60 * 60 * 24,
      async sendVerificationRequest({ identifier, url }) {
        const res = await sendEmail({
          to: identifier,
          subject: `Your sign-in link for ${siteConfig.name}`,
          template: "magic-link",
          react: MagicLinkEmail({ url }),
        });
        if (!res.ok) throw new Error(`Could not send sign-in email: ${res.error}`);
      },
    }),
    ...(features.google ? [Google({ clientId: env.AUTH_GOOGLE_ID, clientSecret: env.AUTH_GOOGLE_SECRET, allowDangerousEmailAccountLinking: true })] : []),
  ],
  callbacks: {
    session({ session, user }) {
      session.user.id = user.id;
      session.user.role = (user.role as "USER" | "ADMIN") ?? "USER";
      session.user.handle = user.handle ?? null;
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      if (!user.id) return;
      // Attribute referral from the ?ref= cookie set by proxy.ts
      try {
        const code = (await cookies()).get(REF_COOKIE)?.value;
        if (code) {
          const referrer = await db.user.findUnique({ where: { referralCode: code }, select: { id: true } });
          if (referrer && referrer.id !== user.id) {
            await db.user.update({ where: { id: user.id }, data: { referredById: referrer.id } });
          }
        }
      } catch {
        /* cookies() unavailable outside a request: skip */
      }
    },
    async signIn({ user }) {
      if (!user.id || !user.email) return;
      if (adminEmails.includes(user.email.toLowerCase()) && user.role !== "ADMIN") {
        await db.user.update({ where: { id: user.id }, data: { role: "ADMIN" } });
      }
      await claimGuestRecords(user.id, user.email);
    },
  },
});
