export interface CategoryData {
    category_id: string;
    category_name: string;
    parent_id: string | null;
    category_image: string | null;
    category_description: string | null;
    is_deleted: boolean;
    status: "Draft" | "Live" | "Hidden";
}

export interface CategoryCreateRequest {
    category_name: string;
    category_image: string;
    category_description?: string | null;
    sub_category_names?: string[];
    status?: "Draft" | "Live" | "Hidden";
}

export interface CategoryUpdateRequest extends Partial<CategoryCreateRequest & {parent_id : string}> {}

export interface CategoryBulkIdsRequest {
    ids: string[];
}

export interface CategoryBulkStatusRequest {
    ids: string[];
    status: "Draft" | "Live" | "Hidden";
}

export interface CategoryResponse extends CategoryData {
    _id: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface ApiResponse<T> {
    status: number;
    message: string;
    data: T;
}

export interface CategoryListItem {
    category_id: string;
    category_name: string;
    parent_category_name: string | null;
    status: "Draft" | "Live" | "Hidden";
    total_product: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface CategoryListSummary {
    totalCategory: number;
    total_category_live: number;
    total_category_hidden: number;
    total_category_draft: number;
}
