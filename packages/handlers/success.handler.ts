import { payloadUtils } from '../utils';
export const successHandler = (data: any, req: any, res: any) => {
  const statusCode = data.status || 200;
  res.status(statusCode).send(payloadUtils.getSuccessPayload(data));
};
