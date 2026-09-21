import {
  categorySchema,
  categoryUpdateSchema,
  categoryBulkIdsSchema,
  categoryBulkStatusSchema,
} from '../schemas/category.schema';
import { CategoryModel } from '../models/category.model';
import { categoryService } from '../category/category.services';

jest.mock('../models/category.model', () => ({
  CategoryModel: {
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
    updateMany: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    deleteMany: jest.fn(),
    aggregate: jest.fn(),
    collection: { name: 'categories' },
  },
}));

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

describe('categoryService.updateCategory', () => {
  it('ignores sub_category arrays when updating a category', async () => {
    (CategoryModel.findOne as jest.Mock).mockResolvedValue({
      category_id: 'cat-1',
      category_name: 'Phones',
      parent_id: null,
      is_deleted: false,
      status: 'Draft',
    });
    (CategoryModel.find as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue([]),
    });

    (CategoryModel.findOneAndUpdate as jest.Mock).mockResolvedValue({
      category_id: 'cat-1',
      category_name: 'Phones',
      status: 'Live',
    });

    await categoryService.updateCategory('cat-1', {
      category_name: 'Phones',
      status: 'Live',
      sub_category: [{ category_id: 'sub-1', category_name: 'Apple' }],
      sub_category_names: [],
    } as any);

    expect(CategoryModel.findOneAndUpdate).toHaveBeenCalledWith(
      { category_id: 'cat-1', is_deleted: false },
      { category_name: 'Phones', status: 'Live' },
      { new: true, runValidators: true },
    );
  });

  it('creates only new subcategories from sub_category_names on update', async () => {
    (CategoryModel.findOne as jest.Mock).mockResolvedValue({
      category_id: 'cat-1',
      category_name: 'Phones',
      parent_id: null,
      is_deleted: false,
      status: 'Draft',
    });
    (CategoryModel.find as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue([]),
    });

    (CategoryModel.findOneAndUpdate as jest.Mock).mockResolvedValue({
      category_id: 'cat-1',
      category_name: 'Phones',
      status: 'Live',
    });

    (CategoryModel.create as jest.Mock).mockResolvedValue({
      category_id: 'sub-1',
      category_name: 'Apple',
      parent_id: 'cat-1',
      is_deleted: false,
    });

    await categoryService.updateCategory('cat-1', {
      category_name: 'Phones',
      status: 'Live',
      sub_category_names: ['Apple', 'Samsung'],
    } as any);

    expect(CategoryModel.create).toHaveBeenCalledTimes(2);
    expect(CategoryModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        category_name: 'Apple',
        parent_id: 'cat-1',
      }),
    );
    expect(CategoryModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        category_name: 'Samsung',
        parent_id: 'cat-1',
      }),
    );
  });
});

describe('categoryService.listCategories', () => {
  it('projects category_image in the list response', async () => {
    (CategoryModel.aggregate as jest.Mock).mockResolvedValue([
      {
        items: [
          {
            category_id: 'cat-1',
            category_name: 'Phones',
            category_image: 'https://cdn.example.com/phones.png',
            status: 'Live',
            total_product: 2,
            sub_category: [],
            createdAt: '2024-01-01',
            updatedAt: '2024-01-02',
          },
        ],
        total: [{ count: 1 }],
        statusCounts: [{ _id: 'Live', count: 1 }],
      },
    ]);

    const result = await categoryService.listCategories({
      page: 1,
      limit: 10,
      skip: 0,
      query: '',
      status: 'Live',
    });

    expect(CategoryModel.aggregate).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          $facet: expect.objectContaining({
            items: expect.arrayContaining([
              expect.objectContaining({
                $project: expect.objectContaining({
                  category_image: 1,
                }),
              }),
            ]),
          }),
        }),
      ]),
    );
    expect(result).toEqual(
      expect.objectContaining({
        items: [
          expect.objectContaining({
            category_image: 'https://cdn.example.com/phones.png',
          }),
        ],
      }),
    );
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
