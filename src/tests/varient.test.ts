import {
  varientSchema,
  varientUpdateSchema,
  varientBulkIdsSchema,
  varientBulkStatusSchema,
} from '../schemas/varient.schema';

// No supertest / mongodb-memory-server is configured in this project yet, so
// these cover the pure, network-free validation logic (mirrors auth.test.ts).

describe('varientSchema', () => {
  it('accepts a valid payload with only the required fields', () => {
    const result = varientSchema.safeParse({ varient_name: 'Color', varient_values: ['blue', 'black', 'white'] });
    expect(result.success).toBe(true);
  });

  it('accepts a valid payload with all fields', () => {
    const result = varientSchema.safeParse({
      varient_name: 'Color',
      varient_values: ['blue', 'black', 'white'],
      status: 'Draft',
    });
    expect(result.success).toBe(true);
  });

  it('accepts Hidden as a valid status', () => {
    const result = varientSchema.safeParse({ varient_name: 'Color', varient_values: ['blue'], status: 'Hidden' });
    expect(result.success).toBe(true);
  });

  it('rejects a missing varient_name', () => {
    const result = varientSchema.safeParse({ varient_values: ['blue'] });
    expect(result.success).toBe(false);
  });

  it('rejects an empty varient_name', () => {
    const result = varientSchema.safeParse({ varient_name: '', varient_values: ['blue'] });
    expect(result.success).toBe(false);
  });

  it('rejects a non-string varient_name', () => {
    const result = varientSchema.safeParse({ varient_name: 123, varient_values: ['blue'] });
    expect(result.success).toBe(false);
  });

  it('rejects a missing varient_values', () => {
    const result = varientSchema.safeParse({ varient_name: 'Color' });
    expect(result.success).toBe(false);
  });

  it('rejects an empty varient_values array', () => {
    const result = varientSchema.safeParse({ varient_name: 'Color', varient_values: [] });
    expect(result.success).toBe(false);
  });

  it('rejects a non-array varient_values', () => {
    const result = varientSchema.safeParse({ varient_name: 'Color', varient_values: 'blue' });
    expect(result.success).toBe(false);
  });

  it('rejects a varient_values array containing an empty string', () => {
    const result = varientSchema.safeParse({ varient_name: 'Color', varient_values: ['blue', ''] });
    expect(result.success).toBe(false);
  });

  it('rejects a varient_values array containing a non-string item', () => {
    const result = varientSchema.safeParse({ varient_name: 'Color', varient_values: ['blue', 42] });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid status', () => {
    const result = varientSchema.safeParse({ varient_name: 'Color', varient_values: ['blue'], status: 'Archived' });
    expect(result.success).toBe(false);
  });

  it('rejects an empty payload', () => {
    const result = varientSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe('varientUpdateSchema', () => {
  it('accepts an empty payload (all fields optional on update)', () => {
    const result = varientUpdateSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts a partial payload with only status', () => {
    const result = varientUpdateSchema.safeParse({ status: 'Live' });
    expect(result.success).toBe(true);
  });

  it('accepts Hidden as a valid status', () => {
    const result = varientUpdateSchema.safeParse({ status: 'Hidden' });
    expect(result.success).toBe(true);
  });

  it('accepts a partial payload with only varient_values', () => {
    const result = varientUpdateSchema.safeParse({ varient_values: ['red', 'green'] });
    expect(result.success).toBe(true);
  });

  it('rejects an empty varient_name when provided', () => {
    const result = varientUpdateSchema.safeParse({ varient_name: '' });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid status when provided', () => {
    const result = varientUpdateSchema.safeParse({ status: 'Archived' });
    expect(result.success).toBe(false);
  });

  it('rejects an empty varient_values array when provided', () => {
    const result = varientUpdateSchema.safeParse({ varient_values: [] });
    expect(result.success).toBe(false);
  });

  it('rejects a non-array varient_values when provided', () => {
    const result = varientUpdateSchema.safeParse({ varient_values: 'blue' });
    expect(result.success).toBe(false);
  });
});

describe('varientBulkIdsSchema', () => {
  it('accepts a valid payload', () => {
    const result = varientBulkIdsSchema.safeParse({ ids: ['abc123', 'def456'] });
    expect(result.success).toBe(true);
  });

  it('rejects an empty ids array', () => {
    const result = varientBulkIdsSchema.safeParse({ ids: [] });
    expect(result.success).toBe(false);
  });

  it('rejects a missing ids field', () => {
    const result = varientBulkIdsSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('rejects an ids array containing an empty string', () => {
    const result = varientBulkIdsSchema.safeParse({ ids: [''] });
    expect(result.success).toBe(false);
  });
});

describe('varientBulkStatusSchema', () => {
  it('accepts a valid payload', () => {
    const result = varientBulkStatusSchema.safeParse({ ids: ['abc123'], status: 'Live' });
    expect(result.success).toBe(true);
  });

  it('accepts Hidden as a valid status', () => {
    const result = varientBulkStatusSchema.safeParse({ ids: ['abc123'], status: 'Hidden' });
    expect(result.success).toBe(true);
  });

  it('rejects an empty ids array', () => {
    const result = varientBulkStatusSchema.safeParse({ ids: [], status: 'Live' });
    expect(result.success).toBe(false);
  });

  it('rejects a missing ids field', () => {
    const result = varientBulkStatusSchema.safeParse({ status: 'Live' });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid status value', () => {
    const result = varientBulkStatusSchema.safeParse({ ids: ['abc123'], status: 'Archived' });
    expect(result.success).toBe(false);
  });

  it('rejects a missing status field', () => {
    const result = varientBulkStatusSchema.safeParse({ ids: ['abc123'] });
    expect(result.success).toBe(false);
  });
});
