jest.mock('../user/user.services', () => ({
  userService: {
    listUsers: jest.fn(),
    updateUserStatus: jest.fn(),
    removeUsers: jest.fn(),
    hardRemoveUsers: jest.fn(),
    getUserDetails: jest.fn(),
  },
}));

import { userService } from '../user/user.services';
import {
  getAllUsers,
  updateUserStatus,
  removeUsers,
  hardRemoveUsers,
  getUserDetails,
} from '../user/user.controller';

const mockRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

const listResult = { items: [{ user_id: 'u1', email: 'a@example.com' }], total: 1, page: 1, limit: 20, totalPages: 1 };
const detailsResult = {
  user: { user_id: 'u1', email: 'a@example.com' },
  profile: null,
};

afterEach(() => {
  jest.clearAllMocks();
});

describe('getAllUsers', () => {
  it('reads page/limit/query/status from the query string and forwards them to listUsers', async () => {
    (userService.listUsers as jest.Mock).mockResolvedValue(listResult);

    const req: any = { query: { page: '2', limit: '10', query: 'john', status: 'active' } };
    const res = mockRes();

    await getAllUsers(req, res, jest.fn());

    expect(userService.listUsers).toHaveBeenCalledWith({
      page: 2,
      limit: 10,
      skip: 10,
      query: 'john',
      status: 'active',
    });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('defaults pagination when no query params are given', async () => {
    (userService.listUsers as jest.Mock).mockResolvedValue(listResult);

    const req: any = { query: {} };
    const res = mockRes();

    await getAllUsers(req, res, jest.fn());

    expect(userService.listUsers).toHaveBeenCalled();
    expect(userService.getUserDetails).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('returns 500 when the service errors', async () => {
    (userService.listUsers as jest.Mock).mockResolvedValue({ status: 500, message: 'boom' });

    const req: any = { query: {} };
    const res = mockRes();

    await getAllUsers(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('getUserDetails', () => {
  it('reads user_id from the query string and forwards it to getUserDetails', async () => {
    (userService.getUserDetails as jest.Mock).mockResolvedValue(detailsResult);

    const req: any = { query: { user_id: 'u1' } };
    const res = mockRes();

    await getUserDetails(req, res, jest.fn());

    expect(userService.getUserDetails).toHaveBeenCalledWith('u1');
    expect(userService.listUsers).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('returns 404 when the queried user_id does not exist', async () => {
    (userService.getUserDetails as jest.Mock).mockResolvedValue({ status: 404, message: 'Not Found' });

    const req: any = { query: { user_id: 'missing' } };
    const res = mockRes();

    await getUserDetails(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(404);
  });
});

describe('updateUserStatus', () => {
  it('forwards user_ids and status from the request body to the service', async () => {
    (userService.updateUserStatus as jest.Mock).mockResolvedValue({ updated: 2 });

    const req: any = { body: { user_ids: ['u1', 'u2'], status: 'suspended' } };
    const res = mockRes();

    await updateUserStatus(req, res, jest.fn());

    expect(userService.updateUserStatus).toHaveBeenCalledWith(['u1', 'u2'], 'suspended');
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('returns 404 when the service reports users not found', async () => {
    (userService.updateUserStatus as jest.Mock).mockResolvedValue({ status: 404, message: 'Not Found' });

    const req: any = { body: { user_ids: ['missing'], status: 'suspended' } };
    const res = mockRes();

    await updateUserStatus(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(404);
  });
});

describe('removeUsers', () => {
  it('forwards user_ids from the request body to the soft-delete service', async () => {
    (userService.removeUsers as jest.Mock).mockResolvedValue({ removed: 1 });

    const req: any = { body: { user_ids: ['u1'] } };
    const res = mockRes();

    await removeUsers(req, res, jest.fn());

    expect(userService.removeUsers).toHaveBeenCalledWith(['u1']);
    expect(userService.hardRemoveUsers).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('returns 404 when the service reports users not found', async () => {
    (userService.removeUsers as jest.Mock).mockResolvedValue({ status: 404, message: 'Not Found' });

    const req: any = { body: { user_ids: ['missing'] } };
    const res = mockRes();

    await removeUsers(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(404);
  });
});

describe('hardRemoveUsers', () => {
  it('forwards user_ids from the request body to the hard-delete service, not the soft-delete one', async () => {
    (userService.hardRemoveUsers as jest.Mock).mockResolvedValue({ deleted: 1 });

    const req: any = { body: { user_ids: ['u1'] } };
    const res = mockRes();

    await hardRemoveUsers(req, res, jest.fn());

    expect(userService.hardRemoveUsers).toHaveBeenCalledWith(['u1']);
    expect(userService.removeUsers).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('returns 404 when the service reports users not found', async () => {
    (userService.hardRemoveUsers as jest.Mock).mockResolvedValue({ status: 404, message: 'Not Found' });

    const req: any = { body: { user_ids: ['missing'] } };
    const res = mockRes();

    await hardRemoveUsers(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(404);
  });
});
