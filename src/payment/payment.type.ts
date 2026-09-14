export type PaymentStatus = "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED";
export type PaymentMode = "COD" | "RAZORPAY";

export interface PaymentCreateRequest {
    order_id: string;
    amount: number;
    payment_mode: PaymentMode;
    transaction_id?: string;
    status?: PaymentStatus;
}

export interface PaymentData {
    payment_id: string;
    order_id: string;
    transaction_id: string | null;
    payment_mode: PaymentMode;
    amount: number;
    status: PaymentStatus;
    is_deleted: boolean;
}

export interface PaymentResponse extends PaymentData {
    _id: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface PaymentBulkIdsRequest {
    ids: string[];
}

export interface PaymentBulkStatusRequest {
    ids: string[];
    status: PaymentStatus;
}

export interface ApiResponse<T> {
    status: number;
    message: string;
    data: T;
}
