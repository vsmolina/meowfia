"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { assertAdmin } from "@/lib/auth-helpers";
import { fd, slugSchema, zodMessage } from "@/lib/admin-form";
import { slugify } from "@/lib/format";
import { runPrintfulSyncJob } from "@/lib/jobs";
import type { ActionState } from "@/lib/action-state";

const templateSchema = z.object({
  name: z.string().min(2),
  slug: slugSchema,
  codename: z.string().nullable(),
  tagline: z.string().min(5),
  description: z.string().min(20),
  vehicleType: z.enum(["TANK", "PLANE", "BOAT", "OTHER"]),
  difficulty: z.enum(["RECRUIT", "SOLDIER", "VETERAN", "ELITE"]),
  catSize: z.enum(["KITTEN", "STANDARD", "CHONK"]),
  buildTimeMinutes: z.number().int().min(5).max(10_000),
  materials: z.array(z.string()).min(1, "List at least one material"),
  pricingMode: z.enum(["FREE", "FIXED", "PWYW"]),
  priceCents: z.number().int().min(0),
  suggestedPriceCents: z.number().int().min(0).nullable(),
  commercialUpgradeCents: z.number().int().min(0),
  classroomUpgradeCents: z.number().int().min(0),
  coverImageKey: z.string().min(1, "Upload a cover image"),
  imageKeys: z.array(z.string()),
  pdfLetterKey: z.string().nullable(),
  pdfA4Key: z.string().nullable(),
  tiktokUrl: z.string().url().nullable(),
  featured: z.boolean(),
  isLeadMagnet: z.boolean(),
  membersOnly: z.boolean(),
  earlyAccessHours: z.number().int().min(0).max(720),
  releaseAt: z.date().nullable(),
  status: z.enum(["DRAFT", "PUBLISHED"]),
});

export async function saveTemplateAction(id: string | null, _prev: ActionState, f: FormData): Promise<ActionState> {
  await assertAdmin();
  try {
    const cover = fd.opt(f, "coverImageKey");
    const gallery = fd.all(f, "imageKeys");
    const data = templateSchema.parse({
      name: fd.str(f, "name"),
      slug: fd.str(f, "slug") || slugify(fd.str(f, "name")),
      codename: fd.opt(f, "codename"),
      tagline: fd.str(f, "tagline"),
      description: fd.str(f, "description"),
      vehicleType: fd.str(f, "vehicleType"),
      difficulty: fd.str(f, "difficulty"),
      catSize: fd.str(f, "catSize"),
      buildTimeMinutes: fd.int(f, "buildTimeMinutes"),
      materials: fd.lines(f, "materials"),
      pricingMode: fd.str(f, "pricingMode"),
      priceCents: fd.cents(f, "price") ?? 0,
      suggestedPriceCents: fd.cents(f, "suggestedPrice"),
      commercialUpgradeCents: fd.cents(f, "commercialUpgrade") ?? 1500,
      classroomUpgradeCents: fd.cents(f, "classroomUpgrade") ?? 2500,
      coverImageKey: cover ?? gallery[0] ?? "",
      imageKeys: cover && !gallery.includes(cover) ? [cover, ...gallery] : gallery,
      pdfLetterKey: fd.opt(f, "pdfLetterKey"),
      pdfA4Key: fd.opt(f, "pdfA4Key"),
      tiktokUrl: fd.opt(f, "tiktokUrl"),
      featured: fd.bool(f, "featured"),
      isLeadMagnet: fd.bool(f, "isLeadMagnet"),
      membersOnly: fd.bool(f, "membersOnly"),
      earlyAccessHours: fd.int(f, "earlyAccessHours"),
      releaseAt: fd.date(f, "releaseAt"),
      status: fd.str(f, "status") || "DRAFT",
    });
    if (data.status === "PUBLISHED" && data.pricingMode !== "FREE" && (!data.pdfLetterKey || !data.pdfA4Key)) {
      return { error: "Upload both US Letter and A4 PDFs before publishing." };
    }
    if (data.isLeadMagnet) await db.template.updateMany({ where: { isLeadMagnet: true, ...(id ? { id: { not: id } } : {}) }, data: { isLeadMagnet: false } });
    // A future release date (re)arms drop announcements
    const scheduling = data.releaseAt && data.releaseAt > new Date() ? { dropAnnouncedAt: null, earlyAccessNotifiedAt: null } : {};
    const saved = id ? await db.template.update({ where: { id }, data: { ...data, ...scheduling } }) : await db.template.create({ data: { ...data, ...scheduling, dropAnnouncedAt: data.releaseAt && data.releaseAt <= new Date() ? new Date() : null } });
    revalidatePath("/", "layout");
    return { ok: true, message: "Template saved", redirectTo: `/admin/templates/${saved.id}` };
  } catch (e) {
    return { error: zodMessage(e) };
  }
}

export async function deleteTemplateAction(id: string) {
  await assertAdmin();
  const sold = await db.orderItem.count({ where: { templateId: id } });
  if (sold > 0) {
    await db.template.update({ where: { id }, data: { status: "DRAFT" } });
    revalidatePath("/admin/templates");
    return { archived: true };
  }
  await db.template.delete({ where: { id } });
  revalidatePath("/admin/templates");
  return { deleted: true };
}

export async function saveProductAction(id: string | null, _prev: ActionState, f: FormData): Promise<ActionState> {
  await assertAdmin();
  try {
    const name = fd.str(f, "name");
    const data = z
      .object({
        name: z.string().min(2),
        slug: slugSchema,
        description: z.string().min(10),
        type: z.enum(["KIT", "MERCH"]),
        category: z.string().min(2),
        priceCents: z.number().int().min(0),
        compareAtCents: z.number().int().min(0).nullable(),
        imageKeys: z.array(z.string()).min(1, "Upload at least one image"),
        templateId: z.string().nullable(),
        upsellProductId: z.string().nullable(),
        printfulProductId: z.string().nullable(),
        featured: z.boolean(),
        active: z.boolean(),
      })
      .parse({
        name,
        slug: fd.str(f, "slug") || slugify(name),
        description: fd.str(f, "description"),
        type: fd.str(f, "type"),
        category: fd.str(f, "category"),
        priceCents: fd.cents(f, "price") ?? 0,
        compareAtCents: fd.cents(f, "compareAt"),
        imageKeys: fd.all(f, "imageKeys"),
        templateId: fd.opt(f, "templateId"),
        upsellProductId: fd.opt(f, "upsellProductId"),
        printfulProductId: fd.opt(f, "printfulProductId"),
        featured: fd.bool(f, "featured"),
        active: fd.bool(f, "active"),
      });

    // Variant rows: parallel arrays from the editor
    const vIds = f.getAll("v_id").map(String);
    const vNames = f.getAll("v_name").map(String);
    const vSkus = f.getAll("v_sku").map(String);
    const vPrices = f.getAll("v_price").map(String);
    const vInv = f.getAll("v_inventory").map(String);
    const vPf = f.getAll("v_printful").map(String);
    const variants = vNames
      .map((n, i) => ({
        id: vIds[i] || null,
        name: n.trim(),
        sku: vSkus[i]?.trim(),
        priceCents: vPrices[i]?.trim() ? Math.round(parseFloat(vPrices[i]) * 100) : null,
        inventory: vInv[i]?.trim() === "" ? null : Math.max(0, parseInt(vInv[i], 10) || 0),
        printfulVariantId: vPf[i]?.trim() || null,
      }))
      .filter((v) => v.name && v.sku);
    if (variants.length === 0) return { error: "Add at least one variant (name + SKU)." };

    const product = id ? await db.product.update({ where: { id }, data }) : await db.product.create({ data });
    const keep = variants.filter((v) => v.id).map((v) => v.id!);
    const removable = await db.productVariant.findMany({ where: { productId: product.id, id: { notIn: keep } }, include: { _count: { select: { orderItems: true } } } });
    for (const r of removable) {
      if (r._count.orderItems === 0) await db.productVariant.delete({ where: { id: r.id } });
    }
    for (const v of variants) {
      const { id: vid, ...vd } = v;
      if (vid) await db.productVariant.update({ where: { id: vid }, data: vd });
      else await db.productVariant.create({ data: { ...vd, productId: product.id } });
    }
    revalidatePath("/", "layout");
    return { ok: true, message: "Product saved", redirectTo: `/admin/products/${product.id}` };
  } catch (e) {
    return { error: zodMessage(e) };
  }
}

export async function toggleProductActiveAction(id: string) {
  await assertAdmin();
  const p = await db.product.findUniqueOrThrow({ where: { id } });
  await db.product.update({ where: { id }, data: { active: !p.active } });
  revalidatePath("/shop");
}

export async function syncPrintfulAction() {
  await assertAdmin();
  return runPrintfulSyncJob();
}
