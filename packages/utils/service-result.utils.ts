export interface ServiceError {
  status: number;
  message: string;
}

export const isServiceError = (result: unknown): result is ServiceError =>
  !!result &&
  typeof result === "object" &&
  "status" in result &&
  "message" in result &&
  !("_id" in result) &&
  !Array.isArray(result);
