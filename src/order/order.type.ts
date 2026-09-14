export type OrderStatus =
    | "PENDING"
    | "CONFIRMED"
    | "PROCESSING"
    | "SHIPPED"
    | "DELIVERED"
    | "CANCELLED"
    | "RETURNED";

export type PaymentStatus = "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED";
export type PaymentMode = "COD" | "RAZORPAY";

export interface OrderLineItemInput {
    product_variant_id: string;
    quantity: number;
}

export interface OrderPaymentInput {
    payment_mode: PaymentMode;
    transaction_id?: string;
    status?: PaymentStatus;
}

export interface OrderCreateRequest {
    user_id: string;
    address_id: string;
    products: OrderLineItemInput[];
    payment?: OrderPaymentInput;
}

export interface OrderLineItemData {
    product_id: string;
    product_variant_id: string;
    sku: string[];
    product_name: string;
    GST: string | null;
    variant_combination: string[];
    quantity: number;
    price: number;
    discount_price: number | null;
    line_total: number;
    inventory_managed: boolean;
}

export interface PaymentSummary {
    payment_id: string;
    order_id: string;
    transaction_id: string | null;
    payment_mode: PaymentMode;
    amount: number;
    status: PaymentStatus;
}

export interface OrderResponse {
    order_id: string;
    order_number: string;
    user_id: string;
    address_id: string;
    products: OrderLineItemData[];
    quantity: number;
    total_price: number;
    tax_total: number;
    discount_price: number;
    status: OrderStatus;
    payment_id: string | null;
    payment: PaymentSummary | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface OrderSkuUnit {
    sku: string;
    is_deleted: boolean;
}

export interface OrderListLineItem {
    product_id: string;
    product_variant_id: string;
    sku_units: OrderSkuUnit[];
    GST: string | null;
    product_name: string;
    variant_combination: string[];
    quantity: number;
    price: number;
    discount_price: number | null;
    inventory_managed: boolean;
}

export interface OrderListItem {
    order_id: string;
    order_number: string;
    user_id: string;
    customer_name: string | null;
    customer_email: string | null;
    customer_phone: string | null;
    address_id: string;
    products: OrderListLineItem[];
    total_product: number;
    total_price: number;
    tax_total: number;
    discount_price: number;
    status: OrderStatus;
    payment_id: string | null;
    payment: PaymentSummary | null;
    createdAt: Date;
    updatedAt: Date;
}


export type OrderSummaryMetric =
    | { total_order: number; growth_rate: string }
    | { total_confirm_order: number; growth_rate: string }
    | { total_cancel_order: number; growth_rate: string };

export type OrderListSummary = OrderSummaryMetric[];

export interface OrderBulkIdsRequest {
    ids: string[];
}

export interface OrderBulkStatusRequest {
    ids: string[];
    status: OrderStatus;
}

export interface ApiResponse<T> {
    status: number;
    message: string;
    data: T;
}
