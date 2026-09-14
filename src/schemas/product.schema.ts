import { z } from "zod";

const baseVariantInputSchema = z.object({
    variant_combination: z.array(z.string().min(1)).optional(),
    // One unique code per physical unit currently in stock — length must
    // equal stock_on_hand (enforced below).
    sku: z.array(z.string().min(1)).default([]),
    price: z.number().nonnegative(),
    discount_price: z.number().nonnegative().optional(),
    stock_on_hand: z.number().int().nonnegative().optional(),
    product_images: z.array(z.string()).optional(),
    is_default: z.boolean().optional(),
});

// sku's length must match stock_on_hand exactly — a variant can't have
// units without codes, or codes without matching units.
export const productVariantInputSchema = baseVariantInputSchema.refine(
    (v) => (v.stock_on_hand ?? 0) === v.sku.length,
    {
        message: "sku must contain exactly one code per unit of stock_on_hand",
        path: ["sku"],
    }
);

// stock_on_hand and sku are excluded — stock only ever moves through the
// inventory ledger, and sku codes are fixed at variant-creation time.
export const productVariantUpdateSchema = baseVariantInputSchema
    .omit({ sku: true, stock_on_hand: true })
    .partial();

const productBaseSchema = z.object({
    product_name: z.string().min(1),
    brand_id: z.string().min(1),
    category: z.string().min(1),
    sub_category: z.string().min(1),
    GST: z.string().optional(),
    product_description: z.string().min(1),
    // Optional — when omitted it's inferred from affiliate_link
    // (present -> AFFILIATE, absent -> PHYSICAL).
    product_type: z.enum(["PHYSICAL", "AFFILIATE"]).optional(),
    gender: z.enum(["male", "female", "others"]),
    affiliate_link: z.string().url().optional(),
    tag: z.array(z.string()).optional(),
    search_tag: z.array(z.string()).optional(),
    varient_ids: z.array(z.string().min(1)).optional(),
    status: z.enum(["Live", "Draft", "Hidden"]).optional(),
});

export const productSchema = productBaseSchema
    .extend({
        variants: z.array(productVariantInputSchema).min(1),
    })
    .refine(
        (p) => {
            const isAffiliate = p.product_type === "AFFILIATE" || (!p.product_type && !!p.affiliate_link);
            return !isAffiliate || p.variants.every((v) => v.sku.length === 0);
        },
        {
            message: "AFFILIATE products are not inventory managed and cannot carry sku-tracked stock",
            path: ["variants"],
        }
    );

export const productUpdateSchema = productBaseSchema
    .omit({ product_type: true, affiliate_link: true })
    .partial();

export const productBulkIdsSchema = z.object({
    ids: z.array(z.string().min(1)).min(1),
});

export const productBulkStatusSchema = z.object({
    ids: z.array(z.string().min(1)).min(1),
    status: z.enum(["Live", "Draft", "Hidden"]),
});

export const productVariantBulkIdsSchema = z.object({
    product_variant_ids: z.array(z.string().min(1)).min(1),
});
