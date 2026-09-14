export interface PreferencesData {
  preference_id: string;
  category_id: string;
  brand_ids: string[];
  priority: number;
  is_deleted?: boolean;
  status? : "Draft" | "Live" | "Hidden";  
}

export interface ApiResponse<T> {
    status: number;
    message: string;
    data: T;
}

export type preferencesCreateRequest = Omit<PreferencesData, "preference_id" | "is_deleted">

export interface PreferencesListItem {
    preference_id: string;
    category_id: string;
    category_name: string;
    category_image: string | null;
    category_description: string | null;
    brand_ids: string[];
    brand_names: string[];
    priority: number;
    is_deleted?: boolean;
    status: "Draft" | "Live" | "Hidden";
    createdAt: Date;
    updatedAt: Date;
}

export interface PreferencesResponse extends PreferencesData {
    _id: string;
    createdAt: Date;
    updatedAt: Date;
}


export interface PreferencesBulkIdsRequest {
    ids: string[];
}


export interface PreferencesListSummary {
    totalPreferences: number;
    total_preferences_live: number;
    total_preferences_hidden: number;
    total_preferences_draft: number;
}


