export const CONSTANT = {
  PAYLOAD: {
    RECORD_FETCHED_SUCCESSFULLY: "Record Fetched Successfully",
    RECORD_CREATED_SUCCESSFULLY: "Record Created Successfully",
    RECORD_UPDATED_SUCCESSFULLY: "Record Updated Successfully",
    RECORD_DELETED_SUCCESSFULLY: "Record Deleted Successfully",
    RECORD_ALREADY_EXIST: "Record Already Exists",
    SOCIAL_LOGIN_SUCCESSFUL: "Social Login Successful",
  },

  STATUS: {
    SUCCESSFUL: "Successful",
    NOT_FOUND: "Not Found",
    INVALID_CREDS: "Invalid credentials",
    SOMETHING_WENT_WRONG: "Something Went Wrong",
    UNAUTHORIZED: "Unauthorized",
    INVALID_TOKEN:"Invalid or expired token",
    FORBIDDEN: "Forbidden",
    PENDING: "Pending",
    ACTIVE: "Active",
    INACTIVE: "Inactive",
    INVALID_SOCIAL_TOKEN: "Invalid or expired social login token",
    SOCIAL_PROVIDER_MISMATCH:
      "Token provider does not match requested provider",
    SOCIAL_EMAIL_MISSING:
      "Unable to retrieve email from social provider",
  },

  HTTP_STATUS: {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
  },

  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
  },

  REGEX: {
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    STRONG_PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/,
    PHONE: /^(?:\+91|91)?[6-9]\d{9}$/,
  },

  RATE_LIMIT: {
    WINDOW_MS: 15 * 60 * 1000,
    MAX_REQUESTS: 100,
  },

  TOKEN: {
    ACCESS_TOKEN_EXPIRY: "1d",
  },
};
