import "server-only";
import type { ReactElement } from "react";
import { render } from "@react-email/render";
import { db } from "@/lib/db";
import { env, features } from "@/lib/env";
import { siteConfig } from "@/config/site";

type SendArgs = {
  to: string | string[];
  subject: string;
  react: ReactElement;
  /** Short identifier for logs, e.g. "receipt", "magic-link" */
  template: string;
  replyTo?: string;
  headers?: Record<string, string>;
};

export type SendResult = { ok: boolean; provider: "resend" | "console"; id?: string; error?: string };

const FROM = () => env.EMAIL_FROM ?? `${siteConfig.name} <onboarding@resend.dev>`;

/**
 * Sends a transactional or marketing email.
 * Without RESEND_API_KEY the email is rendered and printed to the server console
 * (plain-text version plus any links) and stored in EmailLog, viewable at /admin/emails.
 */
export async function sendEmail({ to, subject, react, template, replyTo, headers }: SendArgs): Promise<SendResult> {
  const recipients = Array.isArray(to) ? to : [to];
  const [html, text] = await Promise.all([render(react), render(react, { plainText: true })]);

  if (!features.resend) {
    const links = [...html.matchAll(/href="([^"]+)"/g)]
      .map((m) => m[1].replace(/&amp;/g, "&"))
      .filter((l) => !l.startsWith("mailto:"));
    console.log(
      [
        "",
        "📬 ───────────── EMAIL (console mode, no RESEND_API_KEY) ─────────────",
        `To:       ${recipients.join(", ")}`,
        `Subject:  ${subject}`,
        `Template: ${template}`,
        "──────────────────────────────────────────────────────────────────────",
        text.slice(0, 1500),
        links.length ? `\nLinks:\n${[...new Set(links)].map((l) => `  → ${l}`).join("\n")}` : "",
        "──────────────────────────────────────────────────────────────────────",
        "",
      ].join("\n"),
    );
    await logEmail(recipients, subject, template, "console", "logged", html);
    return { ok: true, provider: "console" };
  }

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(env.RESEND_API_KEY);
    const { data, error } = await resend.emails.send({
      from: FROM(),
      to: recipients,
      subject,
      html,
      text,
      replyTo: replyTo ?? env.EMAIL_REPLY_TO,
      headers,
    });
    if (error) throw new Error(error.message);
    await logEmail(recipients, subject, template, "resend", "sent");
    return { ok: true, provider: "resend", id: data?.id };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error(`[email] Failed to send "${template}" to ${recipients.join(", ")}: ${message}`);
    await logEmail(recipients, subject, template, "resend", "failed", undefined, message);
    return { ok: false, provider: "resend", error: message };
  }
}

async function logEmail(
  to: string[],
  subject: string,
  template: string,
  provider: string,
  status: string,
  html?: string,
  error?: string,
) {
  try {
    await db.emailLog.create({
      data: { to: to.join(", "), subject, template, provider, status, html: html?.slice(0, 200_000), error },
    });
  } catch (e) {
    console.warn("[email] could not write EmailLog", e);
  }
}
