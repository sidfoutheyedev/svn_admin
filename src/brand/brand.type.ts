import type { StatMetric } from "../../packages/utils";

export interface BrandData {
    brand_id: string;
    brand_name: string;
    brand_image: string;
    brand_type: "affiliate" | "onboarding";
    brand_website: string | null;
    brand_affiliate_link: string | null;
    brand_tag: string[];
    brand_search_tag: string[];
    is_deleted: boolean;
    status: "Draft" | "Live" | "Hidden";
}

export interface BrandCreateRequest {
    brand_name: string;
    brand_image: string;
    brand_type?: "affiliate" | "onboarding";
    brand_website?: string | null;
    brand_affiliate_link?: string | null;
    brand_tag: string[];
    brand_search_tag: string[];
    status?: "Draft" | "Live" | "Hidden";
}

export interface BrandUpdateRequest extends Partial<BrandCreateRequest> {}

export interface BrandBulkIdsRequest {
    ids: string[];
}

export interface BrandBulkStatusRequest {
    ids: string[];
    status: "Draft" | "Live" | "Hidden";
}

export interface BrandResponse extends BrandData {
    _id: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface ApiResponse<T> {
    status: number;
    message: string;
    data: T;
}

export interface BrandListItem {
    brand_id: string;
    brand_name: string;
    brand_affiliate_link: string | null;
    brand_type: "affiliate" | "onboarding";
    status: "Draft" | "Live" | "Hidden";
    total_product: number;
    total_revenue: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface BrandPerformance {
    revenue: StatMetric;
    total_product: number;
    products_sold: StatMetric;
}

export interface BrandDetailResponse extends BrandResponse {
    performance: BrandPerformance;
}

export interface BrandListSummary {
    totalBrand: number;
    total_brand_live: number;
    total_brand_hidden: number;
    total_brand_draft: number;
    total_revenue: StatMetric;
    affiliate_revenue: StatMetric;
    onboarded_revenue: StatMetric;
}
