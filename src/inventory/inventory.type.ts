export type MovementType = "INBOUND" | "OUTBOUND";

// STOCKS ADJUSTED: opening/adjusted stock recorded on product create or edit.
// CUSTOMER_RETURN: stock added back after a refund.
// SALE: stock removed when an order/purchase goes through.
export type MovementReason = "STOCKS ADJUSTED" | "SALE" | "CUSTOMER_RETURN" | "PURCHASE";

export type ReferenceType = "ORDER" | "RETURN" | "PURCHASE" | "MANUAL";


export interface RecordMovementRequest {
    product_variant_id: string;
    reason: MovementReason;
    quantity: number;
    idempotency_key: string;
    reference_id?: string;
    reference_type?: ReferenceType;
    note?: string;
    performed_by?: string;
}

export interface InventoryMovementResponse {
    _id: string;
    product_variant_id: string;
    type: MovementType;
    reason: MovementReason;
    quantity: number;
    balance_after: number;
    reference_id: string | null;
    reference_type: ReferenceType | null;
    idempotency_key: string;
    note: string | null;
    performed_by: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface ApiResponse<T> {
    status: number;
    message: string;
    data: T;
}

export interface InventoryTopSoldProduct {
    product_name: string;
    product_image: string | null;
    growth_rate: string;
}

export interface InventoryListSummary {
    total_stock_count: number;
    top_sold_product: InventoryTopSoldProduct | null;
}
