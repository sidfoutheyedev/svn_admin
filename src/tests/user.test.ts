import { userStatusSchema, userRemoveSchema } from '../schemas/user.schema';

// No supertest / mongodb-memory-server is configured in this project yet, so
// these cover the pure, network-free validation logic (mirrors auth.test.ts).

describe('userStatusSchema', () => {
  it('accepts a valid payload', () => {
    const result = userStatusSchema.safeParse({ user_ids: ['u1'], status: 'active' });
    expect(result.success).toBe(true);
  });

  it('accepts each valid status value', () => {
    for (const status of ['active', 'inactive', 'suspended']) {
      const result = userStatusSchema.safeParse({ user_ids: ['u1'], status });
      expect(result.success).toBe(true);
    }
  });

  it('accepts multiple user_ids', () => {
    const result = userStatusSchema.safeParse({ user_ids: ['u1', 'u2', 'u3'], status: 'suspended' });
    expect(result.success).toBe(true);
  });

  it('rejects a missing user_ids', () => {
    const result = userStatusSchema.safeParse({ status: 'active' });
    expect(result.success).toBe(false);
  });

  it('rejects an empty user_ids array', () => {
    const result = userStatusSchema.safeParse({ user_ids: [], status: 'active' });
    expect(result.success).toBe(false);
  });

  it('rejects a user_ids array containing an empty string', () => {
    const result = userStatusSchema.safeParse({ user_ids: [''], status: 'active' });
    expect(result.success).toBe(false);
  });

  it('rejects a missing status', () => {
    const result = userStatusSchema.safeParse({ user_ids: ['u1'] });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid status enum value', () => {
    const result = userStatusSchema.safeParse({ user_ids: ['u1'], status: 'banned' });
    expect(result.success).toBe(false);
  });

  it('rejects an empty payload', () => {
    const result = userStatusSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe('userRemoveSchema', () => {
  it('accepts a valid payload', () => {
    const result = userRemoveSchema.safeParse({ user_ids: ['u1'] });
    expect(result.success).toBe(true);
  });

  it('accepts multiple user_ids', () => {
    const result = userRemoveSchema.safeParse({ user_ids: ['u1', 'u2'] });
    expect(result.success).toBe(true);
  });

  it('rejects a missing user_ids', () => {
    const result = userRemoveSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('rejects an empty user_ids array', () => {
    const result = userRemoveSchema.safeParse({ user_ids: [] });
    expect(result.success).toBe(false);
  });

  it('rejects a user_ids array containing an empty string', () => {
    const result = userRemoveSchema.safeParse({ user_ids: [''] });
    expect(result.success).toBe(false);
  });
});
