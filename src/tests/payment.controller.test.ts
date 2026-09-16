jest.mock('../payment/payment.services', () => ({
  paymentService: {
    createPayment: jest.fn(),
    readPayment: jest.fn(),
    listPayments: jest.fn(),
    updatePaymentsStatus: jest.fn(),
    deletePayment: jest.fn(),
    hardDeletePayments: jest.fn(),
  },
}));

import { paymentService } from '../payment/payment.services';
import {
  createPayment,
  readPayment,
  getAllPayments,
  updatePaymentsStatus,
  deletePayment,
  hardDeletePayments,
} from '../payment/payment.controller';

const mockRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

const record = { payment_id: 'payment-1', order_id: 'order-1', amount: 100, status: 'PENDING' };

afterEach(() => {
  jest.clearAllMocks();
});

describe('createPayment', () => {
  it('forwards the request body to the service and returns 201', async () => {
    (paymentService.createPayment as jest.Mock).mockResolvedValue(record);

    const body = { order_id: 'order-1', amount: 100 };
    const req: any = { body };
    const res = mockRes();

    await createPayment(req, res, jest.fn());

    expect(paymentService.createPayment).toHaveBeenCalledWith(body);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('returns 400 when the order does not exist', async () => {
    (paymentService.createPayment as jest.Mock).mockResolvedValue({ status: 400, message: 'Order not found' });

    const req: any = { body: { order_id: 'missing', amount: 100 } };
    const res = mockRes();

    await createPayment(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe('getAllPayments', () => {
  it('reads page/limit/order_id/status from the query string and forwards them to listPayments', async () => {
    (paymentService.listPayments as jest.Mock).mockResolvedValue({ items: [record], total: 1, page: 2, limit: 10, totalPages: 1 });

    const req: any = { query: { page: '2', limit: '10', order_id: 'order-1', status: 'SUCCESS' } };
    const res = mockRes();

    await getAllPayments(req, res, jest.fn());

    expect(paymentService.listPayments).toHaveBeenCalledWith({
      page: 2,
      limit: 10,
      skip: 10,
      order_id: 'order-1',
      status: 'SUCCESS',
    });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('defaults pagination when no query params are given', async () => {
    (paymentService.listPayments as jest.Mock).mockResolvedValue({ items: [], total: 0, page: 1, limit: 20, totalPages: 1 });

    const req: any = { query: {} };
    const res = mockRes();

    await getAllPayments(req, res, jest.fn());

    expect(paymentService.listPayments).toHaveBeenCalled();
    expect(paymentService.readPayment).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

describe('readPayment', () => {
  it('reads payment_id from the query string, not params', async () => {
    (paymentService.readPayment as jest.Mock).mockResolvedValue(record);

    const req: any = { query: { payment_id: 'payment-1' }, params: {} };
    const res = mockRes();

    await readPayment(req, res, jest.fn());

    expect(paymentService.readPayment).toHaveBeenCalledWith('payment-1');
    expect(paymentService.listPayments).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('returns 404 when the queried payment_id does not exist', async () => {
    (paymentService.readPayment as jest.Mock).mockResolvedValue({ status: 404, message: 'Not Found' });

    const req: any = { query: { payment_id: 'missing' }, params: {} };
    const res = mockRes();

    await readPayment(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(404);
  });
});

describe('updatePaymentsStatus', () => {
  it('forwards ids and status from the request body to the service', async () => {
    (paymentService.updatePaymentsStatus as jest.Mock).mockResolvedValue({ updated: 2 });

    const req: any = { body: { ids: ['payment-1', 'payment-2'], status: 'SUCCESS' } };
    const res = mockRes();

    await updatePaymentsStatus(req, res, jest.fn());

    expect(paymentService.updatePaymentsStatus).toHaveBeenCalledWith(['payment-1', 'payment-2'], 'SUCCESS');
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('returns 500 when the service errors', async () => {
    (paymentService.updatePaymentsStatus as jest.Mock).mockResolvedValue({ status: 500, message: 'Something Went Wrong' });

    const req: any = { body: { ids: ['payment-1'], status: 'SUCCESS' } };
    const res = mockRes();

    await updatePaymentsStatus(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('deletePayment', () => {
  it('forwards req.body.ids to the service', async () => {
    (paymentService.deletePayment as jest.Mock).mockResolvedValue(record);

    const req: any = { query: {}, params: {}, body: { ids: ['payment-1'] } };
    const res = mockRes();

    await deletePayment(req, res, jest.fn());

    expect(paymentService.deletePayment).toHaveBeenCalledWith(['payment-1']);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('returns 404 when the payment_id in the body does not exist', async () => {
    (paymentService.deletePayment as jest.Mock).mockResolvedValue({ status: 404, message: 'Not Found' });

    const req: any = { query: {}, params: {}, body: { ids: ['missing'] } };
    const res = mockRes();

    await deletePayment(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(404);
  });
});

describe('hardDeletePayments', () => {
  it('forwards req.body.ids to the service', async () => {
    (paymentService.hardDeletePayments as jest.Mock).mockResolvedValue({ deleted: 2 });

    const req: any = { query: {}, params: {}, body: { ids: ['payment-1', 'payment-2'] } };
    const res = mockRes();

    await hardDeletePayments(req, res, jest.fn());

    expect(paymentService.hardDeletePayments).toHaveBeenCalledWith(['payment-1', 'payment-2']);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('returns 500 when the service errors', async () => {
    (paymentService.hardDeletePayments as jest.Mock).mockResolvedValue({ status: 500, message: 'Something Went Wrong' });

    const req: any = { query: {}, params: {}, body: { ids: ['payment-1'] } };
    const res = mockRes();

    await hardDeletePayments(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(500);
  });
});
