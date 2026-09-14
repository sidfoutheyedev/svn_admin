import {
  categorySchema,
  categoryUpdateSchema,
  categoryBulkIdsSchema,
  categoryBulkStatusSchema,
} from '../schemas/category.schema';

// No supertest / mongodb-memory-server is configured in this project yet, so
// these cover the pure, network-free validation logic (mirrors auth.test.ts).

describe('categorySchema', () => {
  it('accepts a valid payload with only required fields', () => {
    const result = categorySchema.safeParse({
      category_name: 'Electronics',
      category_image: 'https://example.com/image.png',
    });
    expect(result.success).toBe(true);
  });

  it('accepts a valid payload with all fields', () => {
    const result = categorySchema.safeParse({
      category_name: 'Electronics',
      parent_id: 'abc123',
      category_image: 'https://example.com/image.png',
      category_description: 'Gadgets and devices',
      status: 'Draft',
    });
    expect(result.success).toBe(true);
  });

  it('accepts Hidden as a valid status', () => {
    const result = categorySchema.safeParse({
      category_name: 'Electronics',
      category_image: 'https://example.com/image.png',
      status: 'Hidden',
    });
    expect(result.success).toBe(true);
  });

  it('accepts a null parent_id and category_description', () => {
    const result = categorySchema.safeParse({
      category_name: 'Electronics',
      category_image: 'https://example.com/image.png',
      parent_id: null,
      category_description: null,
    });
    expect(result.success).toBe(true);
  });

  it('accepts sub_category_names on create', () => {
    const result = categorySchema.safeParse({
      category_name: 'Electronics',
      category_image: 'https://example.com/image.png',
      sub_category_names: ['Mobiles', 'Laptops'],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sub_category_names).toEqual(['Mobiles', 'Laptops']);
    }
  });

  it('rejects an empty string inside sub_category_names', () => {
    const result = categorySchema.safeParse({
      category_name: 'Electronics',
      category_image: 'https://example.com/image.png',
      sub_category_names: ['Mobiles', ''],
    });
    expect(result.success).toBe(false);
  });

  it('rejects a missing category_name', () => {
    const result = categorySchema.safeParse({ category_image: 'https://example.com/image.png' });
    expect(result.success).toBe(false);
  });

  it('rejects an empty category_name', () => {
    const result = categorySchema.safeParse({
      category_name: '',
      category_image: 'https://example.com/image.png',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a missing category_image', () => {
    const result = categorySchema.safeParse({ category_name: 'Electronics' });
    expect(result.success).toBe(false);
  });

  it('rejects an empty category_image', () => {
    const result = categorySchema.safeParse({ category_name: 'Electronics', category_image: '' });
    expect(result.success).toBe(false);
  });

  it('rejects a non-string category_name', () => {
    const result = categorySchema.safeParse({ category_name: 123, category_image: 'https://example.com/image.png' });
    expect(result.success).toBe(false);
  });

  it('rejects a non-string parent_id', () => {
    const result = categorySchema.safeParse({
      category_name: 'Electronics',
      category_image: 'https://example.com/image.png',
      parent_id: 42,
    });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid status', () => {
    const result = categorySchema.safeParse({
      category_name: 'Electronics',
      category_image: 'https://example.com/image.png',
      status: 'Archived',
    });
    expect(result.success).toBe(false);
  });

  it('rejects an empty payload', () => {
    const result = categorySchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe('categoryUpdateSchema', () => {
  it('accepts an empty payload (all fields optional on update)', () => {
    const result = categoryUpdateSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts a partial payload with only status', () => {
    const result = categoryUpdateSchema.safeParse({ status: 'Live' });
    expect(result.success).toBe(true);
  });

  it('accepts Hidden as a valid status', () => {
    const result = categoryUpdateSchema.safeParse({ status: 'Hidden' });
    expect(result.success).toBe(true);
  });

  it('rejects an empty category_name when provided', () => {
    const result = categoryUpdateSchema.safeParse({ category_name: '' });
    expect(result.success).toBe(false);
  });

  it('rejects an empty category_image when provided', () => {
    const result = categoryUpdateSchema.safeParse({ category_image: '' });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid status when provided', () => {
    const result = categoryUpdateSchema.safeParse({ status: 'Archived' });
    expect(result.success).toBe(false);
  });

  it('rejects a non-string category_description when provided', () => {
    const result = categoryUpdateSchema.safeParse({ category_description: 99 });
    expect(result.success).toBe(false);
  });
});

describe('categoryBulkIdsSchema', () => {
  it('accepts a valid payload', () => {
    const result = categoryBulkIdsSchema.safeParse({ ids: ['abc123', 'def456'] });
    expect(result.success).toBe(true);
  });

  it('rejects an empty ids array', () => {
    const result = categoryBulkIdsSchema.safeParse({ ids: [] });
    expect(result.success).toBe(false);
  });

  it('rejects a missing ids field', () => {
    const result = categoryBulkIdsSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('rejects an ids array containing an empty string', () => {
    const result = categoryBulkIdsSchema.safeParse({ ids: [''] });
    expect(result.success).toBe(false);
  });
});

describe('categoryBulkStatusSchema', () => {
  it('accepts a valid payload', () => {
    const result = categoryBulkStatusSchema.safeParse({ ids: ['abc123'], status: 'Live' });
    expect(result.success).toBe(true);
  });

  it('accepts Hidden as a valid status', () => {
    const result = categoryBulkStatusSchema.safeParse({ ids: ['abc123'], status: 'Hidden' });
    expect(result.success).toBe(true);
  });

  it('rejects an empty ids array', () => {
    const result = categoryBulkStatusSchema.safeParse({ ids: [], status: 'Live' });
    expect(result.success).toBe(false);
  });

  it('rejects a missing ids field', () => {
    const result = categoryBulkStatusSchema.safeParse({ status: 'Live' });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid status value', () => {
    const result = categoryBulkStatusSchema.safeParse({ ids: ['abc123'], status: 'Archived' });
    expect(result.success).toBe(false);
  });

  it('rejects a missing status field', () => {
    const result = categoryBulkStatusSchema.safeParse({ ids: ['abc123'] });
    expect(result.success).toBe(false);
  });
});
