jest.mock('../brand/brand.services', () => ({
  brandService: {
    createBrand: jest.fn(),
    updateBrand: jest.fn(),
    deleteBrand: jest.fn(),
    hardDeleteBrands: jest.fn(),
    updateBrandsStatus: jest.fn(),
    readBrand: jest.fn(),
    listBrands: jest.fn(),
  },
}));

import { brandService } from '../brand/brand.services';
import {
  getAllBrand,
  readBrand,
  updateBrand,
  deleteBrand,
  hardDeleteBrands,
  updateBrandsStatus,
} from '../brand/brand.controller';

const mockRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

const record = { brand_id: 'abc123', brand_name: 'Acme' };

afterEach(() => {
  jest.clearAllMocks();
});


describe('readBrand', () => {
  it('reads brand_id from the query string, not params', async () => {
    (brandService.readBrand as jest.Mock).mockResolvedValue(record);

    const req: any = { query: { brand_id: 'abc123' }, params: {} };
    const res = mockRes();

    await readBrand(req, res, jest.fn());

    expect(brandService.readBrand).toHaveBeenCalledWith(
      'abc123',
      expect.objectContaining({ range: undefined, start_date: undefined, end_date: undefined }),
    );
    expect(brandService.listBrands).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('forwards range/start_date/end_date query params to the service for the performance window', async () => {
    (brandService.readBrand as jest.Mock).mockResolvedValue(record);

    const req: any = {
      query: { brand_id: 'abc123', range: '7d', start_date: '2026-01-01', end_date: '2026-01-08' },
      params: {},
    };
    const res = mockRes();

    await readBrand(req, res, jest.fn());

    expect(brandService.readBrand).toHaveBeenCalledWith(
      'abc123',
      { range: '7d', start_date: '2026-01-01', end_date: '2026-01-08' },
    );
  });

  it('returns 404 when the queried brand_id does not exist', async () => {
    (brandService.readBrand as jest.Mock).mockResolvedValue({ status: 404, message: 'Not Found' });

    const req: any = { query: { brand_id: 'missing' }, params: {} };
    const res = mockRes();

    await readBrand(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('passes through the performance block from the service untouched', async () => {
    const brandWithPerformance = {
      ...record,
      performance: {
        revenue: { value: '41000', growth: '+12.4%' },
        total_product: 8000,
        products_sold: { value: '5000', growth: '+3.1%' },
      },
    };
    (brandService.readBrand as jest.Mock).mockResolvedValue(brandWithPerformance);

    const req: any = { query: { brand_id: 'abc123', range: '30d' }, params: {} };
    const res = mockRes();

    await readBrand(req, res, jest.fn());

    expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ data: brandWithPerformance }));
  });
});

describe('updateBrand', () => {
  it('reads brand_id from the query string, not params', async () => {
    (brandService.updateBrand as jest.Mock).mockResolvedValue(record);

    const req: any = { query: { brand_id: 'abc123' }, params: {}, body: { brand_name: 'Updated' } };
    const res = mockRes();

    await updateBrand(req, res, jest.fn());

    expect(brandService.updateBrand).toHaveBeenCalledWith('abc123', { brand_name: 'Updated' });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('returns 404 when the brand_id in the query does not exist', async () => {
    (brandService.updateBrand as jest.Mock).mockResolvedValue({ status: 404, message: 'Not Found' });

    const req: any = { query: { brand_id: 'missing' }, params: {}, body: {} };
    const res = mockRes();

    await updateBrand(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(404);
  });
});
describe('hardDeleteBrands', () => {
  it('forwards req.body.ids to the service', async () => {
    (brandService.hardDeleteBrands as jest.Mock).mockResolvedValue({ deleted: 2 });

    const req: any = { query: {}, params: {}, body: { ids: ['abc123', 'def456'] } };
    const res = mockRes();

    await hardDeleteBrands(req, res, jest.fn());

    expect(brandService.hardDeleteBrands).toHaveBeenCalledWith(['abc123', 'def456']);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('returns 500 when the service errors', async () => {
    (brandService.hardDeleteBrands as jest.Mock).mockResolvedValue({ status: 500, message: 'Something Went Wrong' });

    const req: any = { query: {}, params: {}, body: { ids: ['abc123'] } };
    const res = mockRes();

    await hardDeleteBrands(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('updateBrandsStatus', () => {
  it('forwards req.body.ids and req.body.status to the service', async () => {
    (brandService.updateBrandsStatus as jest.Mock).mockResolvedValue({ updated: 2 });

    const req: any = { query: {}, params: {}, body: { ids: ['abc123', 'def456'], status: 'Hidden' } };
    const res = mockRes();

    await updateBrandsStatus(req, res, jest.fn());

    expect(brandService.updateBrandsStatus).toHaveBeenCalledWith(['abc123', 'def456'], 'Hidden');
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('returns 500 when the service errors', async () => {
    (brandService.updateBrandsStatus as jest.Mock).mockResolvedValue({ status: 500, message: 'Something Went Wrong' });

    const req: any = { query: {}, params: {}, body: { ids: ['abc123'], status: 'Live' } };
    const res = mockRes();

    await updateBrandsStatus(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(500);
  });
});
