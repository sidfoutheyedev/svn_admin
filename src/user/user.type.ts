export type UserStatus = "active" | "inactive" | "suspended";

export interface UserListItem {
    _id: string;
    user_id: string;
    full_name: string | null;
    email: string;
    phone: string | null;
    status: UserStatus;
    dob: Date | null;
    gender: "male" | "female" | "others" | null;
    lastLogin: Date | null;
    createdAt: Date;
}

export interface UserStatusUpdateRequest {
    user_ids: string[];
    status: UserStatus;
}

export interface UserRemoveRequest {
    user_ids: string[];
}

export interface UserListSummary {
    total_user: number;
    total_active_user: number;
    total_inactive_user: number;
    total_suspended_user: number;
}

export interface UserDetailsResponse {
    user_id: string;
    email: string;
    role: "admin" | "user";
    provider: "local" | "google" | "apple";
    full_name: string | null;
    dob: Date | null;
    gender: "male" | "female" | "others" | null;
    profile_images: string | null;
    phone: string | null;
    new_brand_reminder: boolean | null;
    trend_reminder: boolean | null;
    more_reminder: boolean | null;
    status: UserStatus;
    lastLogin: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface StyleDnaSlice {
    preference_id: string;
    label: string;
    score: number;
    percentage: number;
}

export interface StyleDna {
    slices: StyleDnaSlice[];
    note: string | null;
}

export interface UserDetailResponse extends UserDetailsResponse {
    style_dna: StyleDna;
}

export interface ApiResponse<T> {
    status: number;
    message: string;
    data: T;
}
