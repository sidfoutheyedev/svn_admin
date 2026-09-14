jest.mock("../category/category.services", () => ({
  categoryService: {
    createCategory: jest.fn(),
    updateCategory: jest.fn(),
    deleteCategory: jest.fn(),
    hardDeleteCategories: jest.fn(),
    updateCategoriesStatus: jest.fn(),
    readCategory: jest.fn(),
    listCategories: jest.fn(),
  },
}));

import { categoryService } from "../category/category.services";
import {
  getAllCategory,
  readCategory,
  updateCategory,
  deleteCategory,
  hardDeleteCategories,
  updateCategoriesStatus,
} from "../category/category.controller";

const mockRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

const record = { category_id: "abc123", category_name: "Electronics" };

afterEach(() => {
  jest.clearAllMocks();
});

describe("getAllCategory", () => {
  it("lists categories via the paginated list service", async () => {
    (categoryService.listCategories as jest.Mock).mockResolvedValue({
      items: [record],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    });

    const req: any = { query: {} };
    const res = mockRes();

    await getAllCategory(req, res, jest.fn());

    expect(categoryService.listCategories).toHaveBeenCalled();
    expect(categoryService.readCategory).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("passes through the flat list items and summary counts from the service untouched", async () => {
    const listResult = {
      items: [
        {
          category_id: "abc123",
          category_name: "Electronics",
          status: "Live",
          total_product: 40000,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
      summary: {
        totalCategory: 12480,
        total_category_live: 11902,
        total_category_hidden: 300,
        total_category_draft: 278,
      },
    };
    (categoryService.listCategories as jest.Mock).mockResolvedValue(listResult);

    const req: any = { query: {} };
    const res = mockRes();

    await getAllCategory(req, res, jest.fn());

    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({ data: listResult }),
    );
  });
});

describe("readCategory", () => {
  it("reads category_id from the query string, not params", async () => {
    (categoryService.readCategory as jest.Mock).mockResolvedValue(record);

    const req: any = { query: { category_id: "abc123" }, params: {} };
    const res = mockRes();

    await readCategory(req, res, jest.fn());

    expect(categoryService.readCategory).toHaveBeenCalledWith("abc123");
    expect(categoryService.listCategories).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("returns 404 when the queried category_id does not exist", async () => {
    (categoryService.readCategory as jest.Mock).mockResolvedValue({
      status: 404,
      message: "Not Found",
    });

    const req: any = { query: { category_id: "missing" }, params: {} };
    const res = mockRes();

    await readCategory(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(404);
  });
});

describe("updateCategory", () => {
  it("reads category_id from the query string, not params", async () => {
    (categoryService.updateCategory as jest.Mock).mockResolvedValue(record);

    const req: any = {
      query: { category_id: "abc123" },
      params: {},
      body: { category_name: "Updated" },
    };
    const res = mockRes();

    await updateCategory(req, res, jest.fn());

    expect(categoryService.updateCategory).toHaveBeenCalledWith("abc123", {
      category_name: "Updated",
    });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("returns 404 when the category_id in the query does not exist", async () => {
    (categoryService.updateCategory as jest.Mock).mockResolvedValue({
      status: 404,
      message: "Not Found",
    });

    const req: any = {
      query: { category_id: "missing" },
      params: {},
      body: {},
    };
    const res = mockRes();

    await updateCategory(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(404);
  });
});
describe("hardDeleteCategories", () => {
  it("forwards req.body.ids to the service", async () => {
    (categoryService.hardDeleteCategories as jest.Mock).mockResolvedValue({
      deleted: 2,
    });

    const req: any = {
      query: {},
      params: {},
      body: { ids: ["abc123", "def456"] },
    };
    const res = mockRes();

    await hardDeleteCategories(req, res, jest.fn());

    expect(categoryService.hardDeleteCategories).toHaveBeenCalledWith([
      "abc123",
      "def456",
    ]);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("returns 500 when the service errors", async () => {
    (categoryService.hardDeleteCategories as jest.Mock).mockResolvedValue({
      status: 500,
      message: "Something Went Wrong",
    });

    const req: any = { query: {}, params: {}, body: { ids: ["abc123"] } };
    const res = mockRes();

    await hardDeleteCategories(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe("updateCategoriesStatus", () => {
  it("forwards req.body.ids and req.body.status to the service", async () => {
    (categoryService.updateCategoriesStatus as jest.Mock).mockResolvedValue({
      updated: 2,
    });

    const req: any = {
      query: {},
      params: {},
      body: { ids: ["abc123", "def456"], status: "Hidden" },
    };
    const res = mockRes();

    await updateCategoriesStatus(req, res, jest.fn());

    expect(categoryService.updateCategoriesStatus).toHaveBeenCalledWith(
      ["abc123", "def456"],
      "Hidden",
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("returns 500 when the service errors", async () => {
    (categoryService.updateCategoriesStatus as jest.Mock).mockResolvedValue({
      status: 500,
      message: "Something Went Wrong",
    });

    const req: any = {
      query: {},
      params: {},
      body: { ids: ["abc123"], status: "Live" },
    };
    const res = mockRes();

    await updateCategoriesStatus(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(500);
  });
});
