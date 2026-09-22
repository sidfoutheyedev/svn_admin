import type { StatMetric } from "../../packages/utils";

export type ProductType = "PHYSICAL" | "AFFILIATE";
export type ProductStatus = "Live" | "Draft" | "Hidden";
export type Gender = "male" | "female" | "others";
export type Style = "Topwear" | "Bottomwear" | "Dresses" | "Sets & Co-Ords" | "Footwear" | "Accessories" | "Innerwear";

export interface ProductVariantInput {
    variant_combination?: string[];
    sku: string[];
    price: number;
    discount_price?: number;
    stock_on_hand?: number;
    product_images?: string[];
    is_default?: boolean;
}

export interface ProductCreateRequest {
    product_name: string;
    brand_id: string;
    category: string;
    style: Style;
    sub_category: string;
    GST?: string;
    product_description: string;
    product_type?: ProductType;
    affiliate_link?: string;
    tag?: string[];
    search_tag?: string[];
    gender: Gender;
    varient_ids?: string[];
    status?: ProductStatus;
    variants: ProductVariantInput[];
}

export interface ProductVariantResponse {
    product_variant_id: string;
    product_id: string;
    variant_combination: string[];
    price: number;
    discount_price: number | null;
    stock_on_hand: number;
    product_images: string[];
    is_default: boolean;
    is_active: boolean;
    sku: string[];
}

export interface ProductResponse {
    _id: string;
    product_id: string;
    product_name: string;
    brand_id: string;
    category: string;
    sub_category: string;
    GST: string | null;
    style: Style;
    product_description: string;
    product_type: ProductType;
    inventory_managed: boolean;
    affiliate_link: string | null;
    tag: string[];
    search_tag: string[];
    varient_ids: string[];
    status: ProductStatus;
    createdAt: Date;
    updatedAt: Date;
    variants: ProductVariantResponse[];
}


export interface ProductUpdateRequest
    extends Partial<Omit<ProductCreateRequest, "variants" | "product_type" | "affiliate_link">> { }


export interface ProductVariantUpdateRequest {
    variant_combination?: string[];
    price?: number;
    discount_price?: number;
    product_images?: string[];
    is_default?: boolean;
    is_active? : boolean;
}

export interface ProductBulkIdsRequest {
    ids: string[];
}

export interface ProductBulkStatusRequest {
    ids: string[];
    status: ProductStatus;
}

export interface ProductVariantBulkIdsRequest {
    product_variant_ids: string[];
}


export interface BrandSummary {
    brand_id: string;
    brand_name: string;
}

export interface CategorySummary {
    category_id: string;
    category_name: string;
}

export interface VarientSummary {
    varient_id: string;
    varient_name: string;
    varient_values: string[];
}

export interface SelectedVarient {
    varient_name: string;
    value: string;
}

export interface ProductVariantDetail {
    product_variant_id: string;
    variant_combination: string[];
    selected_varient: SelectedVarient[];
    price: number;
    discount_price: number | null;
    stock_on_hand: number;
    product_images: string[];
    is_default: boolean;
    is_active: boolean;
    sku: string[];
}


export interface ProductVariantListItem {
    product_variant_id: string;
    product_id: string;
    product_name: string;
    variant_combination: string[];
    price: number;
    discount_price: number | null;
    stock_on_hand: number;
    product_images: string[];
    is_default: boolean;
    is_active: boolean;
    sku: string[];
    createdAt: Date;
    updatedAt: Date;
}

export interface ProductDetail {
    product_id: string;
    product_name: string;
    product_description: string;
    GST: string | null;
    style: Style | null;
    product_type: ProductType;
    inventory_managed: boolean;
    affiliate_link: string | null;
    gender: Gender;
    tag: string[];
    search_tag: string[];
    status: ProductStatus;
    brand: BrandSummary | null;
    category: CategorySummary | null;
    sub_category: CategorySummary | null;
    selected_varients: VarientSummary[];
    product_varient: ProductVariantDetail[];
    left_swipe_count: number;
    right_swipe_count: number;
    saves: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface ProductListSummary {
    left_swipes: StatMetric;
    right_swipes: StatMetric;
    saved_products: StatMetric;
    total_product_active: number;
    total_product_hidden: number;
    total_product_draft: number;
}

export interface ApiResponse<T> {
    status: number;
    message: string;
    data: T;
}
