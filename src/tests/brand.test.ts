import { brandSchema, brandUpdateSchema, brandBulkIdsSchema, brandBulkStatusSchema } from '../schemas/brand.schema';

// No supertest / mongodb-memory-server is configured in this project yet, so
// these cover the pure, network-free validation logic (mirrors auth.test.ts).

const validPayload = {
  brand_name: 'Acme',
  brand_image: 'https://example.com/logo.png',
  brand_tag: ['popular'],
  brand_search_tag: ['acme'],
};

describe('brandSchema', () => {
  it('accepts a valid payload with only required fields', () => {
    const result = brandSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it('accepts a valid payload with all fields', () => {
    const result = brandSchema.safeParse({
      ...validPayload,
      brand_type: 'affiliate',
      brand_website: 'https://acme.com',
      brand_affiliate_link: 'https://acme.com/ref/123',
      status: 'Draft',
    });
    expect(result.success).toBe(true);
  });

  it('accepts Hidden as a valid status', () => {
    const result = brandSchema.safeParse({ ...validPayload, status: 'Hidden' });
    expect(result.success).toBe(true);
  });

  it('accepts a null brand_website and brand_affiliate_link', () => {
    const result = brandSchema.safeParse({
      ...validPayload,
      brand_website: null,
      brand_affiliate_link: null,
    });
    expect(result.success).toBe(true);
  });

  it('rejects a missing brand_name', () => {
    const { brand_name, ...rest } = validPayload;
    const result = brandSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('rejects an empty brand_name', () => {
    const result = brandSchema.safeParse({ ...validPayload, brand_name: '' });
    expect(result.success).toBe(false);
  });

  it('rejects a missing brand_image', () => {
    const { brand_image, ...rest } = validPayload;
    const result = brandSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('rejects an empty brand_image', () => {
    const result = brandSchema.safeParse({ ...validPayload, brand_image: '' });
    expect(result.success).toBe(false);
  });

  it('rejects a missing brand_tag', () => {
    const { brand_tag, ...rest } = validPayload;
    const result = brandSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('rejects an empty brand_tag array', () => {
    const result = brandSchema.safeParse({ ...validPayload, brand_tag: [] });
    expect(result.success).toBe(false);
  });

  it('rejects a missing brand_search_tag', () => {
    const { brand_search_tag, ...rest } = validPayload;
    const result = brandSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('rejects an empty brand_search_tag array', () => {
    const result = brandSchema.safeParse({ ...validPayload, brand_search_tag: [] });
    expect(result.success).toBe(false);
  });

  it('rejects a brand_tag array containing an empty string', () => {
    const result = brandSchema.safeParse({ ...validPayload, brand_tag: [''] });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid brand_type', () => {
    const result = brandSchema.safeParse({ ...validPayload, brand_type: 'reseller' });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid brand_website url', () => {
    const result = brandSchema.safeParse({ ...validPayload, brand_website: 'not-a-url' });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid brand_affiliate_link url', () => {
    const result = brandSchema.safeParse({ ...validPayload, brand_affiliate_link: 'not-a-url' });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid status', () => {
    const result = brandSchema.safeParse({ ...validPayload, status: 'Archived' });
    expect(result.success).toBe(false);
  });

  it('rejects an empty payload', () => {
    const result = brandSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe('brandUpdateSchema', () => {
  it('accepts an empty payload (all fields optional on update)', () => {
    const result = brandUpdateSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts a partial payload with only status', () => {
    const result = brandUpdateSchema.safeParse({ status: 'Live' });
    expect(result.success).toBe(true);
  });

  it('accepts Hidden as a valid status', () => {
    const result = brandUpdateSchema.safeParse({ status: 'Hidden' });
    expect(result.success).toBe(true);
  });

  it('rejects an empty brand_name when provided', () => {
    const result = brandUpdateSchema.safeParse({ brand_name: '' });
    expect(result.success).toBe(false);
  });

  it('rejects an empty brand_tag array when provided', () => {
    const result = brandUpdateSchema.safeParse({ brand_tag: [] });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid brand_website url when provided', () => {
    const result = brandUpdateSchema.safeParse({ brand_website: 'not-a-url' });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid status when provided', () => {
    const result = brandUpdateSchema.safeParse({ status: 'Archived' });
    expect(result.success).toBe(false);
  });
});

describe('brandBulkIdsSchema', () => {
  it('accepts a valid payload', () => {
    const result = brandBulkIdsSchema.safeParse({ ids: ['abc123', 'def456'] });
    expect(result.success).toBe(true);
  });

  it('rejects an empty ids array', () => {
    const result = brandBulkIdsSchema.safeParse({ ids: [] });
    expect(result.success).toBe(false);
  });

  it('rejects a missing ids field', () => {
    const result = brandBulkIdsSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('rejects an ids array containing an empty string', () => {
    const result = brandBulkIdsSchema.safeParse({ ids: [''] });
    expect(result.success).toBe(false);
  });
});

describe('brandBulkStatusSchema', () => {
  it('accepts a valid payload', () => {
    const result = brandBulkStatusSchema.safeParse({ ids: ['abc123'], status: 'Live' });
    expect(result.success).toBe(true);
  });

  it('accepts Hidden as a valid status', () => {
    const result = brandBulkStatusSchema.safeParse({ ids: ['abc123'], status: 'Hidden' });
    expect(result.success).toBe(true);
  });

  it('rejects an empty ids array', () => {
    const result = brandBulkStatusSchema.safeParse({ ids: [], status: 'Live' });
    expect(result.success).toBe(false);
  });

  it('rejects a missing ids field', () => {
    const result = brandBulkStatusSchema.safeParse({ status: 'Live' });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid status value', () => {
    const result = brandBulkStatusSchema.safeParse({ ids: ['abc123'], status: 'Archived' });
    expect(result.success).toBe(false);
  });

  it('rejects a missing status field', () => {
    const result = brandBulkStatusSchema.safeParse({ ids: ['abc123'] });
    expect(result.success).toBe(false);
  });
});
