"use server";

import { z } from "zod";
import { db, type Prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { checkRateLimit } from "@/lib/rate-limit";
import { siteUrl } from "@/lib/site-url";
import { siteConfig } from "@/config/site";
import { emailField, firstError, honeypot, optionalText } from "@/lib/validation";
import { SimpleEmail } from "@/emails/simple";
import type { ActionState } from "@/lib/action-state";

const base = {
  name: z.string().trim().min(2, "Please enter your name").max(100),
  email: emailField,
  company: optionalText(120),
  message: z.string().trim().min(10, "Tell us a bit more (10+ characters)").max(4000),
  company_website: honeypot,
};

const sponsorship = z.object({ ...base, budget: optionalText(60), timeline: optionalText(60), deliverables: optionalText(200) });
const classroom = z.object({ ...base, students: z.coerce.number().int().min(1).max(10_000).optional(), kitsWanted: optionalText(200), needBy: optionalText(30), licenseOnly: z.string().optional() });
const contact = z.object(base);

/** Sponsorship, classroom quote, and general contact forms. Saves to admin and emails her. */
export async function submitInquiryAction(kind: "SPONSORSHIP" | "CLASSROOM" | "CONTACT", _prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!["SPONSORSHIP", "CLASSROOM", "CONTACT"].includes(kind)) return { error: "Invalid form" };
  const limited = await checkRateLimit("form", `inquiry-${kind}`);
  if (limited) return { error: limited };
  const raw = Object.fromEntries(formData);
  const schema = kind === "SPONSORSHIP" ? sponsorship : kind === "CLASSROOM" ? classroom : contact;
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return { error: firstError(parsed.error), fieldErrors: z.flattenError(parsed.error).fieldErrors };
  const { name, email, company, message, company_website: _hp, ...rest } = parsed.data as z.infer<typeof sponsorship> & z.infer<typeof classroom>;
  void _hp;
  const budget = "budget" in rest ? (rest.budget as string | undefined) : undefined;
  const extra = Object.fromEntries(Object.entries(rest).filter(([k, v]) => v !== undefined && k !== "budget"));

  const inquiry = await db.inquiry.create({ data: { kind, name, email, company, budget, message, data: Object.keys(extra).length ? (extra as Prisma.InputJsonValue) : undefined } });
  const label = kind === "SPONSORSHIP" ? "Sponsorship inquiry" : kind === "CLASSROOM" ? "Classroom / bulk quote request" : "Contact message";
  const to = kind === "SPONSORSHIP" ? siteConfig.creator.partnershipsEmail || siteConfig.creator.email : siteConfig.creator.email;

  await Promise.all([
    sendEmail({
      to,
      replyTo: email,
      subject: `📨 ${label}: ${company ?? name}`,
      template: `admin-inquiry-${kind.toLowerCase()}`,
      react: SimpleEmail({
        preview: `${label} from ${name}`,
        heading: label,
        paragraphs: [message],
        details: [["From", `${name} <${email}>`], ...(company ? ([["Company", company]] as [string, string][]) : []), ...(budget ? ([["Budget", budget]] as [string, string][]) : []), ...Object.entries(extra).map(([k, v]) => [k, String(v)] as [string, string])],
        cta: { label: "Open in admin", href: siteUrl("/admin/inquiries") },
      }),
    }),
    sendEmail({
      to: email,
      subject: kind === "SPONSORSHIP" ? "Thanks! Your partnership inquiry is in" : kind === "CLASSROOM" ? "Your classroom quote request is in" : "Message received",
      template: `inquiry-ack-${kind.toLowerCase()}`,
      react: SimpleEmail({
        preview: "We got your message",
        heading: "Transmission received",
        paragraphs: [`Thanks ${name.split(" ")[0]}! We read every message and typically reply within 2–3 business days.`, `Reference: ${inquiry.id.slice(-8).toUpperCase()}`],
      }),
    }),
  ]);
  return { ok: true, message: "Transmission received! We'll reply within 2–3 business days." };
}
