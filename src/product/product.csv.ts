import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";
import { productModel } from "../models/product.model";
import { productVariantModel } from "../models/product_varient.model";
import { SKUModel } from "../models/product_sku.model";
import { CategoryModel } from "../models/category.model";
import { BrandModel } from "../models/brand.model";
import type { ProductCreateRequest, ProductVariantInput } from "./product.type";

export const CSV_COLUMNS = [
    "product_group_id",
    "product_name",
    "brand_id",
    "category",
    "sub_category",
    "style",
    "GST",
    "product_description",
    "product_type",
    "affiliate_link",
    "gender",
    "tag",
    "search_tag",
    "varient_ids",
    "status",
    "variant_combination",
    "sku",
    "price",
    "discount_price",
    "stock_on_hand",
    "product_images",
    "is_default",
] as const;

// List-valued columns are pipe-separated (not comma) so they never collide
// with the CSV's own field separator.
const toList = (value: string | undefined): string[] =>
    value
        ? value
            .split("|")
            .map((v) => v.trim())
            .filter(Boolean)
        : [];

const toOptionalNumber = (value: string | undefined): number | undefined =>
    value === undefined || value.trim() === "" ? undefined : Number(value);

const toOptionalString = (value: string | undefined): string | undefined =>
    value === undefined || value.trim() === "" ? undefined : value.trim();

const PRODUCT_LEVEL_KEYS = [
    "product_name",
    "brand_id",
    "category",
    "sub_category",
    "style",
    "GST",
    "product_description",
    "product_type",
    "affiliate_link",
    "gender",
    "tag",
    "search_tag",
    "varient_ids",
    "status",
] as const;

const REQUIRED_PRODUCT_FIELDS = [
    "product_name",
    "brand_id",
    "category",
    "sub_category",
    "style",
    "product_description",
    "gender",
] as const;

export interface CsvRowError {
    row: number;
    message: string;
}

interface ParsedGroup {
    productLevel: Record<string, unknown>;
    variants: ProductVariantInput[];
    rows: number[];
}

export interface ParsedProductGroup {
    payload: ProductCreateRequest;
    rows: number[];
}

export const parseProductsCsv = (buffer: Buffer): { products: ParsedProductGroup[]; errors: CsvRowError[] } => {
    const errors: CsvRowError[] = [];
    let records: Record<string, string>[];

    try {
        records = parse(buffer, { columns: true, skip_empty_lines: true, trim: true });
    } catch (error) {
        return {
            products: [],
            errors: [{ row: 0, message: error instanceof Error ? error.message : "Malformed CSV" }],
        };
    }

    const groups = new Map<string, ParsedGroup>();

    records.forEach((record, index) => {
        const row = index + 2; // +1 for the header row, +1 to be 1-indexed
        const groupId = toOptionalString(record.product_group_id);
        if (!groupId) {
            errors.push({ row, message: "product_group_id is required" });
            return;
        }
        if (!record.price || Number.isNaN(Number(record.price))) {
            errors.push({ row, message: "price is required and must be a number" });
            return;
        }

        const productLevel: Record<string, unknown> = {
            product_name: toOptionalString(record.product_name),
            brand_id: toOptionalString(record.brand_id),
            category: toOptionalString(record.category),
            sub_category: toOptionalString(record.sub_category),
            style: toOptionalString(record.style),
            GST: toOptionalString(record.GST),
            product_description: toOptionalString(record.product_description),
            product_type: toOptionalString(record.product_type),
            affiliate_link: toOptionalString(record.affiliate_link),
            gender: toOptionalString(record.gender),
            tag: toList(record.tag),
            search_tag: toList(record.search_tag),
            varient_ids: toList(record.varient_ids),
            status: toOptionalString(record.status),
        };

        const variant: ProductVariantInput = {
            variant_combination: toList(record.variant_combination),
            sku: toList(record.sku),
            price: Number(record.price),
            discount_price: toOptionalNumber(record.discount_price),
            stock_on_hand: toOptionalNumber(record.stock_on_hand),
            product_images: toList(record.product_images),
            is_default: record.is_default ? record.is_default.trim().toLowerCase() === "true" : undefined,
        };

        let group = groups.get(groupId);
        if (!group) {
            const missing = REQUIRED_PRODUCT_FIELDS.filter((key) => !productLevel[key]);
            if (missing.length) {
                errors.push({
                    row,
                    message: `Missing required field(s) for group "${groupId}": ${missing.join(", ")}`,
                });
                return;
            }
            group = { productLevel, variants: [], rows: [] };
            groups.set(groupId, group);
        } else {
            const mismatchedKey = PRODUCT_LEVEL_KEYS.find(
                (key) => JSON.stringify(group!.productLevel[key] ?? null) !== JSON.stringify(productLevel[key] ?? null),
            );
            if (mismatchedKey) {
                errors.push({
                    row,
                    message: `"${mismatchedKey}" doesn't match the first row of group "${groupId}" — every row in a group must repeat the same product-level values`,
                });
                return;
            }
        }

        group.variants.push(variant);
        group.rows.push(row);
    });

    const products: ParsedProductGroup[] = [...groups.values()].map((group) => ({
        payload: {
            ...(group.productLevel as Omit<ProductCreateRequest, "variants">),
            variants: group.variants,
        },
        rows: group.rows,
    }));

    return { products, errors };
};

export const buildSampleProductsCsv = (): string => {
    const rows = [
        [
            "P1",
            "Mens T-Shirt",
            "REPLACE_WITH_BRAND_ID",
            "REPLACE_WITH_CATEGORY_ID",
            "REPLACE_WITH_SUB_CATEGORY_ID",
            "Topwear",
            "29ABCDE1234F1Z5",
            "A comfortable cotton t-shirt",
            "PHYSICAL",
            "",
            "male",
            "t-shirt",
            "fashion",
            "REPLACE_WITH_VARIENT_ID_1|REPLACE_WITH_VARIENT_ID_2",
            "Live",
            "black|X",
            "SKU-001|SKU-002",
            "499",
            "399",
            "2",
            "https://example.com/img1.jpg",
            "true",
        ],
        [
            "P1",
            "Mens T-Shirt",
            "REPLACE_WITH_BRAND_ID",
            "REPLACE_WITH_CATEGORY_ID",
            "REPLACE_WITH_SUB_CATEGORY_ID",
            "Topwear",
            "29ABCDE1234F1Z5",
            "A comfortable cotton t-shirt",
            "PHYSICAL",
            "",
            "male",
            "t-shirt",
            "fashion",
            "REPLACE_WITH_VARIENT_ID_1|REPLACE_WITH_VARIENT_ID_2",
            "Live",
            "blue|X",
            "SKU-003|SKU-004",
            "599",
            "499",
            "2",
            "https://example.com/img2.jpg",
            "false",
        ],
        [
            "P2",
            "Affiliate Sneaker",
            "REPLACE_WITH_BRAND_ID",
            "REPLACE_WITH_CATEGORY_ID",
            "REPLACE_WITH_SUB_CATEGORY_ID",
            "Footwear",
            "",
            "An affiliate-linked sneaker (no stock tracked)",
            "AFFILIATE",
            "https://partner.example.com/aff/123",
            "male",
            "",
            "",
            "",
            "Live",
            "",
            "",
            "2999",
            "",
            "",
            "https://example.com/shoe.jpg",
            "true",
        ],
    ];

    return stringify([[...CSV_COLUMNS], ...rows]);
};

export const buildProductsCsvExport = async (): Promise<string> => {
    const products = await productModel.find({ is_deleted: false }).lean();
    const productIds = products.map((p) => p.product_id);

    const variants = productIds.length
        ? await productVariantModel.find({ product_id: { $in: productIds }, is_active: true }).lean()
        : [];
    const variantIds = variants.map((v) => v.product_variant_id);

    const skus = variantIds.length
        ? await SKUModel.find({ product_varient_id: { $in: variantIds } }, { product_varient_id: 1, sku_code: 1, _id: 0 }).lean()
        : [];

    const skusByVariant = new Map<string, string[]>();
    for (const sku of skus) {
        const list = skusByVariant.get(sku.product_varient_id) ?? [];
        list.push(sku.sku_code);
        skusByVariant.set(sku.product_varient_id, list);
    }

    const variantsByProduct = new Map<string, typeof variants>();
    for (const variant of variants) {
        const list = variantsByProduct.get(variant.product_id) ?? [];
        list.push(variant);
        variantsByProduct.set(variant.product_id, list);
    }

    const rows: string[][] = [];
    for (const product of products) {
        for (const variant of variantsByProduct.get(product.product_id) ?? []) {
            rows.push([
                product.product_id,
                product.product_name,
                product.brand_id,
                product.category,
                product.sub_category,
                product.product_style ?? "",
                product.GST ?? "",
                product.product_description,
                product.product_type,
                product.affiliate_link ?? "",
                product.gender,
                (product.tag ?? []).join("|"),
                (product.search_tag ?? []).join("|"),
                (product.varient_ids ?? []).join("|"),
                product.status,
                (variant.variant_combination ?? []).join("|"),
                (skusByVariant.get(variant.product_variant_id) ?? []).join("|"),
                String(variant.price),
                variant.discount_price != null ? String(variant.discount_price) : "",
                String(variant.stock_on_hand),
                (variant.product_images ?? []).join("|"),
                String(variant.is_default),
            ]);
        }
    }

    return stringify([[...CSV_COLUMNS], ...rows]);
};

// create an CSV for Product to given


const RECOMMEDATION_TABLE = [
    "product_id",
    "title",
    "brand",
    "gender",
    "category",
    "subcategory",
    "style",
    "price",
    "in_stock",
    "is_active",
    "primary_image",
    "embedding_text",
] as const;

export const bulkproductrecommedation = async (): Promise<string> => {
    const products = await productModel.find({ is_deleted: false }).lean();

    const brandIds = [...new Set(products.map((p) => p.brand_id))];
    const categoryIds = [...new Set(products.flatMap((p) => [p.category, p.sub_category]))];
    const productIds = products.map((p) => p.product_id);

    const [brands, categories, defaultVariants] = await Promise.all([
        brandIds.length ? BrandModel.find({ brand_id: { $in: brandIds } }).lean() : [],
        categoryIds.length ? CategoryModel.find({ category_id: { $in: categoryIds } }).lean() : [],
        productIds.length
            ? productVariantModel.find({ product_id: { $in: productIds }, is_default: true }).lean()
            : [],
    ]);

    const brandNameById = new Map(brands.map((b) => [b.brand_id, b.brand_name]));
    const categoryNameById = new Map(categories.map((c) => [c.category_id, c.category_name]));
    const defaultVariantByProduct = new Map(defaultVariants.map((v) => [v.product_id, v]));

    const rows: string[][] = [];
    for (const product of products) {
        const defaultVariant = defaultVariantByProduct.get(product.product_id);
        if (!defaultVariant) continue;

        const brandName = brandNameById.get(product.brand_id) ?? "";
        const categoryName = categoryNameById.get(product.category) ?? "";
        const subCategoryName = categoryNameById.get(product.sub_category) ?? "";
        // Products created before `product_style` existed have none stored; keep the old category-name value for them.
        const style = product.product_style ?? categoryName;
        const primaryImage = defaultVariant.product_images?.[0] ?? "";

        const embeddingText = [
            product.product_name,
            [subCategoryName, ...(defaultVariant.variant_combination ?? []), ...(product.tag ?? []), brandName]
                .filter(Boolean)
                .join(", "),
        ]
            .filter(Boolean)
            .join(". ");

        rows.push([
            product.product_id,
            product.product_name,
            brandName,
            product.gender,
            categoryName,
            subCategoryName,
            style,
            String(defaultVariant.price),
            String(defaultVariant.stock_on_hand > 0),
            String(defaultVariant.is_active),
            primaryImage,
            embeddingText,
        ]);
    }

    return stringify([[...RECOMMEDATION_TABLE], ...rows]);
};