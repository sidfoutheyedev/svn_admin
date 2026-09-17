export interface UserCredentials {
    email: string;
    password: string;
}

export interface UserData {
    user_id: string;
    email: string;
    role: string;
    username: string;
    password?: string;
    lastlogin?: Date;
    provider?: string;
    token?: string;
}

export type UserRegisterResponse = Omit<
    UserData,
    "password" | "token" | "username"
>;
export type LoginResponse = Omit<UserData, "password">;

export interface ApiResponse<T> {
    status: number;
    message: string;
    data: T;
}


export interface ResetPassword {
    email: string
}

export type UserResetPasswordResponse = Omit <ResetPassword, "password">