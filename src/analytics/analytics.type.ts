import type { AnalyticsRange, RangeQuery, StatMetric } from "../../packages/utils";

export type { AnalyticsRange, StatMetric };
export type AnalyticsQuery = RangeQuery;

export interface CategorySavedShare {
    category_id: string;
    category_name: string;
    count: number;
    // Share of saved_products within the same window, e.g. 67 for 67%.
    percentage: number;
}

export interface StatsOverviewResponse {
    products: StatMetric;
    orders: StatMetric;
    refund_rate: StatMetric;
    total_users: StatMetric;
    brands: StatMetric;
    // Count of DOWN swipes ("add to cart") within the window.
    saved_products: StatMetric;
    // saved_products broken down by each product's top-level category —
    // "Liked by Category" donut. Sorted by count, descending.
    saved_by_category: CategorySavedShare[];
}

export interface RevenueOverviewResponse {
    total_revenue: StatMetric;
    // affiliate_revenue is intentionally omitted — affiliate product
    // management isn't built out yet, so only the onboarded (physical,
    // inventory-managed) split is reported alongside the grand total.
    onboarded_revenue: StatMetric;
}

export interface TopPerformingProduct {
    product_id: string;
    product_name: string;
    product_image: string | null;
    category_id: string | null;
    category_name: string | null;
    sub_category_id: string | null;
    sub_category_name: string | null;
    // Count of LEFT swipes ("like") within the resolved window.
    left_swipe_count: number;
    growth_rate: string;
}

export type TopPerformingProductsResponse = TopPerformingProduct[];

export interface ApiResponse<T> {
    status: number;
    message: string;
    data: T;
}
