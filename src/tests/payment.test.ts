import { paymentCreateSchema, paymentBulkIdsSchema, paymentBulkStatusSchema } from '../schemas/payment.schema';

// No supertest / mongodb-memory-server is configured in this project yet, so
// these cover the pure, network-free validation logic (mirrors auth.test.ts).

const validPayload = {
  order_id: 'order-1',
  amount: 100,
  payment_mode: 'COD',
};

const PAYMENT_STATUSES = ['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED'];
const PAYMENT_MODES = ['COD', 'RAZORPAY'];

describe('paymentCreateSchema', () => {
  it('accepts a valid payload with only required fields', () => {
    const result = paymentCreateSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it('accepts a valid payload with all fields', () => {
    const result = paymentCreateSchema.safeParse({
      ...validPayload,
      transaction_id: 'txn-1',
      status: 'SUCCESS',
    });
    expect(result.success).toBe(true);
  });

  it('accepts a zero amount', () => {
    const result = paymentCreateSchema.safeParse({ ...validPayload, amount: 0 });
    expect(result.success).toBe(true);
  });

  it('accepts each valid status value', () => {
    for (const status of PAYMENT_STATUSES) {
      const result = paymentCreateSchema.safeParse({ ...validPayload, status });
      expect(result.success).toBe(true);
    }
  });

  it('rejects a missing order_id', () => {
    const { order_id, ...rest } = validPayload;
    const result = paymentCreateSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('rejects an empty order_id', () => {
    const result = paymentCreateSchema.safeParse({ ...validPayload, order_id: '' });
    expect(result.success).toBe(false);
  });

  it('rejects a missing amount', () => {
    const { amount, ...rest } = validPayload;
    const result = paymentCreateSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('accepts each valid payment_mode value', () => {
    for (const payment_mode of PAYMENT_MODES) {
      const result = paymentCreateSchema.safeParse({ ...validPayload, payment_mode });
      expect(result.success).toBe(true);
    }
  });

  it('rejects a missing payment_mode', () => {
    const { payment_mode, ...rest } = validPayload;
    const result = paymentCreateSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('rejects an invalid payment_mode', () => {
    const result = paymentCreateSchema.safeParse({ ...validPayload, payment_mode: 'CASH' });
    expect(result.success).toBe(false);
  });

  it('rejects a negative amount', () => {
    const result = paymentCreateSchema.safeParse({ ...validPayload, amount: -1 });
    expect(result.success).toBe(false);
  });

  it('rejects an empty transaction_id when provided', () => {
    const result = paymentCreateSchema.safeParse({ ...validPayload, transaction_id: '' });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid status', () => {
    const result = paymentCreateSchema.safeParse({ ...validPayload, status: 'PROCESSED' });
    expect(result.success).toBe(false);
  });

  it('rejects an empty payload', () => {
    const result = paymentCreateSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe('paymentBulkIdsSchema', () => {
  it('accepts a valid payload', () => {
    const result = paymentBulkIdsSchema.safeParse({ ids: ['abc123', 'def456'] });
    expect(result.success).toBe(true);
  });

  it('rejects an empty ids array', () => {
    const result = paymentBulkIdsSchema.safeParse({ ids: [] });
    expect(result.success).toBe(false);
  });

  it('rejects a missing ids field', () => {
    const result = paymentBulkIdsSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('rejects an ids array containing an empty string', () => {
    const result = paymentBulkIdsSchema.safeParse({ ids: [''] });
    expect(result.success).toBe(false);
  });
});

describe('paymentBulkStatusSchema', () => {
  it('accepts a valid payload', () => {
    const result = paymentBulkStatusSchema.safeParse({ ids: ['abc123'], status: 'SUCCESS' });
    expect(result.success).toBe(true);
  });

  it('accepts each valid status value', () => {
    for (const status of PAYMENT_STATUSES) {
      const result = paymentBulkStatusSchema.safeParse({ ids: ['abc123'], status });
      expect(result.success).toBe(true);
    }
  });

  it('rejects an empty ids array', () => {
    const result = paymentBulkStatusSchema.safeParse({ ids: [], status: 'SUCCESS' });
    expect(result.success).toBe(false);
  });

  it('rejects a missing ids field', () => {
    const result = paymentBulkStatusSchema.safeParse({ status: 'SUCCESS' });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid status value', () => {
    const result = paymentBulkStatusSchema.safeParse({ ids: ['abc123'], status: 'PROCESSED' });
    expect(result.success).toBe(false);
  });

  it('rejects a missing status field', () => {
    const result = paymentBulkStatusSchema.safeParse({ ids: ['abc123'] });
    expect(result.success).toBe(false);
  });
});
