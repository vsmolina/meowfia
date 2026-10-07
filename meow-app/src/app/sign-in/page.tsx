import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth-helpers";
import { features } from "@/lib/env";
import { googleSignInAction } from "@/actions/auth";
import { Stamp, FileTag } from "@/components/brand/stamp";
import { Button } from "@/components/ui/button";
import { EmailSignInForm } from "./sign-in-form";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

const ERRORS: Record<string, string> = {
  Verification: "That sign-in link has expired or was already used. Request a fresh one below.",
  OAuthAccountNotLinked: "That email is already linked to another sign-in method. Use the email link instead.",
  default: "Sign-in failed. Please try again.",
};

export default async function SignInPage({ searchParams }: PageProps<"/sign-in">) {
  const sp = await searchParams;
  const raw = typeof sp.callbackUrl === "string" ? sp.callbackUrl : "/account";
  const callbackUrl = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/account";
  if (await getSessionUser()) redirect(callbackUrl);
  const error = typeof sp.error === "string" ? (ERRORS[sp.error] ?? ERRORS.default) : null;

  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:py-20">
      <div className="relative rounded-xl border-2 border-ink bg-dossier p-6 shadow-stamp sm:p-8">
        <Stamp className="absolute -right-3 -top-4" rotate={8} size="sm">
          Restricted
        </Stamp>
        <FileTag>Form 22-B · Security clearance</FileTag>
        <h1 className="mt-2 font-stencil text-3xl text-olive-dark">Report for duty</h1>
        <p className="mt-2 text-muted-foreground">
          Sign in or create an account, no password required. Access your downloads, track orders, post your cat&apos;s builds, and earn rank.
        </p>
        {error && (
          <p role="alert" className="mt-4 rounded-md border-2 border-stamp/60 bg-stamp/10 p-3 text-sm font-semibold text-stamp">
            {error}
          </p>
        )}
        <div className="mt-6 space-y-4">
          {features.google && (
            <>
              <form action={googleSignInAction}>
                <input type="hidden" name="callbackUrl" value={callbackUrl} />
                <Button type="submit" variant="outline" size="lg" className="w-full">
                  <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
                    <path fill="#4285F4" d="M22.6 12.2c0-.8-.1-1.5-.2-2.2H12v4.2h5.9c-.3 1.4-1 2.5-2.2 3.3v2.7h3.6c2.1-1.9 3.3-4.8 3.3-8z" />
                    <path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.7c-1 .7-2.2 1.1-3.7 1.1-2.9 0-5.3-1.9-6.2-4.5H2.1v2.8C3.9 20.6 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.8 14.2c-.2-.7-.4-1.4-.4-2.2s.1-1.5.4-2.2V7H2.1C1.4 8.5 1 10.2 1 12s.4 3.5 1.1 5l3.7-2.8z" />
                    <path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.2-3.2C17.5 2.1 15 1 12 1 7.7 1 3.9 3.4 2.1 7l3.7 2.8C6.7 7.3 9.1 5.4 12 5.4z" />
                  </svg>
                  Continue with Google
                </Button>
              </form>
              <div className="flex items-center gap-3 text-xs uppercase tracking-widest text-muted-foreground">
                <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
              </div>
            </>
          )}
          <EmailSignInForm callbackUrl={callbackUrl} />
        </div>
        <p className="mt-6 text-xs text-muted-foreground">
          By continuing you agree to our <Link className="underline" href="/legal/terms">Terms</Link> and <Link className="underline" href="/legal/privacy">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
}
