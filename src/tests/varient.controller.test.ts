jest.mock('../varient/varient.services', () => ({
  varientService: {
    createVarient: jest.fn(),
    updateVarient: jest.fn(),
    deleteVarient: jest.fn(),
    hardDeleteVarients: jest.fn(),
    updateVarientsStatus: jest.fn(),
    readVarient: jest.fn(),
    listVarients: jest.fn(),
  },
}));

import { varientService } from '../varient/varient.services';
import {
  getAllVarient,
  readVarient,
  updateVarient,
  deleteVarient,
  hardDeleteVarients,
  updateVarientsStatus,
} from '../varient/varient.controller';

const mockRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

const record = { varient_id: 'abc123', varient_name: 'Color', varient_values: ['blue', 'black', 'white'] };

afterEach(() => {
  jest.clearAllMocks();
});

describe('getAllVarient', () => {
  it('lists varients via the paginated list service', async () => {
    (varientService.listVarients as jest.Mock).mockResolvedValue({ items: [record], total: 1, page: 1, limit: 20, totalPages: 1 });

    const req: any = { query: {} };
    const res = mockRes();

    await getAllVarient(req, res, jest.fn());

    expect(varientService.listVarients).toHaveBeenCalled();
    expect(varientService.readVarient).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

describe('readVarient', () => {
  it('reads varient_id from the query string, not params', async () => {
    (varientService.readVarient as jest.Mock).mockResolvedValue(record);

    const req: any = { query: { varient_id: 'abc123' }, params: {} };
    const res = mockRes();

    await readVarient(req, res, jest.fn());

    expect(varientService.readVarient).toHaveBeenCalledWith('abc123');
    expect(varientService.listVarients).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('returns 404 when the queried varient_id does not exist', async () => {
    (varientService.readVarient as jest.Mock).mockResolvedValue({ status: 404, message: 'Not Found' });

    const req: any = { query: { varient_id: 'missing' }, params: {} };
    const res = mockRes();

    await readVarient(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(404);
  });
});

describe('updateVarient', () => {
  it('reads varient_id from the query string, not params', async () => {
    (varientService.updateVarient as jest.Mock).mockResolvedValue(record);

    const req: any = { query: { varient_id: 'abc123' }, params: {}, body: { varient_name: 'Updated' } };
    const res = mockRes();

    await updateVarient(req, res, jest.fn());

    expect(varientService.updateVarient).toHaveBeenCalledWith('abc123', { varient_name: 'Updated' });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('returns 404 when the varient_id in the query does not exist', async () => {
    (varientService.updateVarient as jest.Mock).mockResolvedValue({ status: 404, message: 'Not Found' });

    const req: any = { query: { varient_id: 'missing' }, params: {}, body: {} };
    const res = mockRes();

    await updateVarient(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(404);
  });
});

describe('deleteVarient', () => {
  it('forwards req.body.ids to the service', async () => {
    (varientService.deleteVarient as jest.Mock).mockResolvedValue(record);

    const req: any = { query: {}, params: {}, body: { ids: ['abc123'] } };
    const res = mockRes();

    await deleteVarient(req, res, jest.fn());

    expect(varientService.deleteVarient).toHaveBeenCalledWith(['abc123']);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('returns 404 when the varient_id in the body does not exist', async () => {
    (varientService.deleteVarient as jest.Mock).mockResolvedValue({ status: 404, message: 'Not Found' });

    const req: any = { query: {}, params: {}, body: { ids: ['missing'] } };
    const res = mockRes();

    await deleteVarient(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(404);
  });
});

describe('hardDeleteVarients', () => {
  it('forwards req.body.ids to the service', async () => {
    (varientService.hardDeleteVarients as jest.Mock).mockResolvedValue({ deleted: 2 });

    const req: any = { query: {}, params: {}, body: { ids: ['abc123', 'def456'] } };
    const res = mockRes();

    await hardDeleteVarients(req, res, jest.fn());

    expect(varientService.hardDeleteVarients).toHaveBeenCalledWith(['abc123', 'def456']);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('returns 500 when the service errors', async () => {
    (varientService.hardDeleteVarients as jest.Mock).mockResolvedValue({ status: 500, message: 'Something Went Wrong' });

    const req: any = { query: {}, params: {}, body: { ids: ['abc123'] } };
    const res = mockRes();

    await hardDeleteVarients(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('updateVarientsStatus', () => {
  it('forwards req.body.ids and req.body.status to the service', async () => {
    (varientService.updateVarientsStatus as jest.Mock).mockResolvedValue({ updated: 2 });

    const req: any = { query: {}, params: {}, body: { ids: ['abc123', 'def456'], status: 'Hidden' } };
    const res = mockRes();

    await updateVarientsStatus(req, res, jest.fn());

    expect(varientService.updateVarientsStatus).toHaveBeenCalledWith(['abc123', 'def456'], 'Hidden');
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('returns 500 when the service errors', async () => {
    (varientService.updateVarientsStatus as jest.Mock).mockResolvedValue({ status: 500, message: 'Something Went Wrong' });

    const req: any = { query: {}, params: {}, body: { ids: ['abc123'], status: 'Live' } };
    const res = mockRes();

    await updateVarientsStatus(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(500);
  });
});
