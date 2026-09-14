jest.mock('../analytics/analytics.service', () => ({
  analyticsService: {
    getStatsOverview: jest.fn(),
    getRevenueOverview: jest.fn(),
  },
}));

import { analyticsService } from '../analytics/analytics.service';
import { getStatsOverview, getRevenueOverview } from '../analytics/analytics.controller';

const mockRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

afterEach(() => {
  jest.clearAllMocks();
});

describe('getStatsOverview', () => {
  it('forwards range/start_date/end_date query params to the service', async () => {
    (analyticsService.getStatsOverview as jest.Mock).mockResolvedValue({});

    const req: any = { query: { range: '7d', start_date: '2026-01-01', end_date: '2026-01-08' } };
    const res = mockRes();

    await getStatsOverview(req, res, jest.fn());

    expect(analyticsService.getStatsOverview).toHaveBeenCalledWith(req.query);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('passes through saved_products and saved_by_category untouched', async () => {
    const statsResult = {
      products: { value: '48920', growth: '+12.4%' },
      orders: { value: '1240000', growth: '+12.4%' },
      refund_rate: { value: '4.7%', growth: '+12.4%' },
      total_users: { value: '48920', growth: '+12.4%' },
      brands: { value: '12480', growth: '+12.4%' },
      saved_products: { value: '86412', growth: '+12.4%' },
      saved_by_category: [
        { category_id: 'abc123', category_name: 'Sneakers', count: 100, percentage: 67 },
      ],
    };
    (analyticsService.getStatsOverview as jest.Mock).mockResolvedValue(statsResult);

    const req: any = { query: {} };
    const res = mockRes();

    await getStatsOverview(req, res, jest.fn());

    expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ data: statsResult }));
  });

  it('returns 500 when the service errors', async () => {
    (analyticsService.getStatsOverview as jest.Mock).mockResolvedValue({ status: 500, message: 'Something Went Wrong' });

    const req: any = { query: {} };
    const res = mockRes();

    await getStatsOverview(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('getRevenueOverview', () => {
  it('forwards query params and passes through the result', async () => {
    const revenueResult = {
      total_revenue: { value: '48920', growth: '+12.4%' },
      onboarded_revenue: { value: '48920', growth: '+12.4%' },
    };
    (analyticsService.getRevenueOverview as jest.Mock).mockResolvedValue(revenueResult);

    const req: any = { query: { range: '30d' } };
    const res = mockRes();

    await getRevenueOverview(req, res, jest.fn());

    expect(analyticsService.getRevenueOverview).toHaveBeenCalledWith(req.query);
    expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ data: revenueResult }));
  });

  it('returns 500 when the service errors', async () => {
    (analyticsService.getRevenueOverview as jest.Mock).mockResolvedValue({ status: 500, message: 'Something Went Wrong' });

    const req: any = { query: {} };
    const res = mockRes();

    await getRevenueOverview(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(500);
  });
});
