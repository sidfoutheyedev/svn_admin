export type RefundStatus = "REQUESTED" | "APPROVED" | "REJECTED" | "PROCESSED";

export interface RefundCreateRequest {
    user_id: string;
    order_id: string;
    shipment_id?: string;
    refund_remark?: string;
}

export interface RefundResponse {
    refund_id: string;
    user_id: string;
    order_id: string;
    shipment_id: string | null;
    refund_status: RefundStatus;
    refund_remark: string | null;
    is_deleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}

// One entry per metric, each pairing a count of refunds *created in the
// current window* with that category's growth vs. the prior equal window —
// see List refunds.
export type RefundSummaryMetric =
    | { recent_refund: number; growth_value: string }
    | { recent_completed: number; growth_value: string }
    | { recent_pending: number; growth_value: string };

export type RefundListSummary = RefundSummaryMetric[];

export interface RefundBulkIdsRequest {
    ids: string[];
}

export interface RefundBulkStatusRequest {
    ids: string[];
    status: RefundStatus;
}

export interface ApiResponse<T> {
    status: number;
    message: string;
    data: T;
}
