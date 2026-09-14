import { payloadUtils } from '../utils';
export const errorHandler = (data: any, req: any, res: any) => {
  const statusCode = data.status || 500;
  res.status(statusCode).send(payloadUtils.getErrorPayload(data));
};
