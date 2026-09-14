export interface VarientData {
    varient_id: string;
    varient_name: string;
    varient_values: string[];
    is_deleted: boolean;
    status: "Draft" | "Live" | "Hidden";
}

export interface VarientCreateRequest {
    varient_name: string;
    varient_values: string[];
    status?: "Draft" | "Live" | "Hidden";
}

export interface VarientUpdateRequest extends Partial<VarientCreateRequest> {}

export interface VarientBulkIdsRequest {
    ids: string[];
}

export interface VarientBulkStatusRequest {
    ids: string[];
    status: "Draft" | "Live" | "Hidden";
}

export interface VarientResponse extends VarientData {
    _id: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface ApiResponse<T> {
    status: number;
    message: string;
    data: T;
}
