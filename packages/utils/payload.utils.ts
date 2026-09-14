const getSuccessPayload = (data: any) => data;
const getErrorPayload = (error: any) => ({ ...error });
const getValidationErrorPayload = (error: any) => {
  const response: { error: { message: string; fields: any[] } } = {
    error: { message: "Validation failed", fields: [] },
  };
  if (error.details) {
    error.details.forEach((e: any) => {
      response.error.fields.push({
        key: e.context?.key || e.path?.join(".") || "unknown",
        type: e.type,
        message: e.message,
      });
    });
  }
  return response;
};
export const payloadUtils = { getSuccessPayload, getErrorPayload, getValidationErrorPayload };
