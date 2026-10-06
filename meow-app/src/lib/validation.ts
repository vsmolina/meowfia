import { z } from "zod";

/** Trimmed, lowercased, validated email */
export const emailField = z.string().trim().toLowerCase().max(254).pipe(z.email("Enter a valid email address"));

/** Optional trimmed string that turns "" into undefined */
export const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : undefined));

/** Honeypot field: must be empty */
export const honeypot = z.string().max(0, "Bot detected").optional();

export function firstError(error: z.ZodError) {
  return error.issues[0]?.message ?? "Please check the form and try again.";
}
