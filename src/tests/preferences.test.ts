jest.mock("../models/preferences.model", () => ({
	PreferencesModel: {
		aggregate: jest.fn(),
		findOne: jest.fn(),
		create: jest.fn(),
		findOneAndUpdate: jest.fn(),
		updateMany: jest.fn(),
	},
}));

jest.mock("../models/category.model", () => ({
	CategoryModel: {
		findOne: jest.fn(),
	},
}));

jest.mock("../models/brand.model", () => ({
	BrandModel: {
		countDocuments: jest.fn(),
	},
}));

import { PreferencesModel } from "../models/preferences.model";
import { CategoryModel } from "../models/category.model";
import { BrandModel } from "../models/brand.model";
import { preferencesService } from "../preferences/preferences.services";

const record = {
	preference_id: "preference-1",
	category_id: "category-1",
	brand_ids: ["brand-1"],
	priority: 1,
	status: "Draft",
};

const mainCategory = {
	category_id: "category-1",
	parent_id: null,
};

afterEach(() => {
	jest.clearAllMocks();
});

describe("preferencesService", () => {
	it("lists preferences via the aggregation pipeline", async () => {
		(PreferencesModel.aggregate as jest.Mock).mockResolvedValue([
			{ data: [record], total: 1 },
		]);

		const result = await preferencesService.getPreferences({
			page: 2,
			limit: 5,
			skip: 5,
			query: "cat",
		});

		expect(PreferencesModel.aggregate).toHaveBeenCalled();
		expect(result).toEqual(
			expect.objectContaining({
				items: [record],
				total: 1,
			}),
		);
	});

	it("filters preferences by status in the aggregation pipeline", async () => {
		(PreferencesModel.aggregate as jest.Mock).mockResolvedValue([
			{ data: [record], total: 1 },
		]);

		await preferencesService.getPreferences({
			page: 1,
			limit: 10,
			skip: 0,
			status: "Live",
		});

		expect(PreferencesModel.aggregate).toHaveBeenCalledWith(
			expect.arrayContaining([
				expect.objectContaining({
					$match: expect.objectContaining({
						status: {
							$regex: "^Live$",
							$options: "i",
						},
					}),
				}),
			]),
		);
	});

	it("creates a preference with a generated id and Draft default status", async () => {
		(PreferencesModel.findOne as jest.Mock).mockResolvedValue(null);
		(CategoryModel.findOne as jest.Mock).mockResolvedValue(mainCategory);
		(BrandModel.countDocuments as jest.Mock).mockResolvedValue(1);
		(PreferencesModel.create as jest.Mock).mockResolvedValue(record);

		const result = await preferencesService.createPreferences({
			category_id: "category-1",
			brand_ids: ["brand-1"],
			priority: 1,
		});

		expect(PreferencesModel.findOne).toHaveBeenCalledWith({
			category_id: "category-1",
			is_deleted: false,
		});
		expect(PreferencesModel.create).toHaveBeenCalledWith(
			expect.objectContaining({
				preference_id: expect.any(String),
				category_id: "category-1",
				brand_ids: ["brand-1"],
				priority: 1,
				status: "Draft",
			}),
		);
		expect(result).toEqual(record);
	});

	it("rejects duplicate category preferences", async () => {
		(PreferencesModel.findOne as jest.Mock).mockResolvedValue(record);

		const result = await preferencesService.createPreferences({
			category_id: "category-1",
			brand_ids: [],
			priority: 1,
		});

		expect(result).toEqual({ status: 409, message: "Record Already Exists" });
		expect(PreferencesModel.create).not.toHaveBeenCalled();
	});

	it("rejects a category_id that is not a main category", async () => {
		(PreferencesModel.findOne as jest.Mock).mockResolvedValue(null);
		(CategoryModel.findOne as jest.Mock).mockResolvedValue({
			category_id: "sub-category-1",
			parent_id: "category-1",
		});

		const result = await preferencesService.createPreferences({
			category_id: "sub-category-1",
			brand_ids: [],
			priority: 1,
		});

		expect(result).toEqual({
			status: 400,
			message: "A preference must reference a main category, not a sub-category",
		});
		expect(PreferencesModel.create).not.toHaveBeenCalled();
	});

	it("rejects a category_id that does not exist", async () => {
		(PreferencesModel.findOne as jest.Mock).mockResolvedValue(null);
		(CategoryModel.findOne as jest.Mock).mockResolvedValue(null);

		const result = await preferencesService.createPreferences({
			category_id: "missing-category",
			brand_ids: [],
			priority: 1,
		});

		expect(result).toEqual({ status: 404, message: "Category not found" });
		expect(PreferencesModel.create).not.toHaveBeenCalled();
	});

	it("rejects brand_ids that do not all exist", async () => {
		(PreferencesModel.findOne as jest.Mock).mockResolvedValue(null);
		(CategoryModel.findOne as jest.Mock).mockResolvedValue(mainCategory);
		(BrandModel.countDocuments as jest.Mock).mockResolvedValue(1);

		const result = await preferencesService.createPreferences({
			category_id: "category-1",
			brand_ids: ["brand-1", "brand-missing"],
			priority: 1,
		});

		expect(result).toEqual({ status: 400, message: "One or more brand_ids do not exist" });
		expect(PreferencesModel.create).not.toHaveBeenCalled();
	});

	it("updates a preference by preference_id, scoped to non-deleted rows", async () => {
		(PreferencesModel.findOneAndUpdate as jest.Mock).mockResolvedValue(record);

		await expect(
			preferencesService.updatePreferences("preference-1", { priority: 2 }),
		).resolves.toEqual(record);

		expect(PreferencesModel.findOneAndUpdate).toHaveBeenCalledWith(
			{ preference_id: "preference-1", is_deleted: false },
			{ priority: 2 },
			{ new: true },
		);
	});

	it("returns 404 when updating a preference that does not exist", async () => {
		(PreferencesModel.findOneAndUpdate as jest.Mock).mockResolvedValue(null);

		await expect(
			preferencesService.updatePreferences("missing", { priority: 2 }),
		).resolves.toEqual({ status: 404, message: "Not Found" });
	});

	it("soft-deletes a preference by preference_id", async () => {
		(PreferencesModel.findOneAndUpdate as jest.Mock).mockResolvedValue(record);

		await expect(preferencesService.deletePreferences("preference-1")).resolves.toEqual(record);

		expect(PreferencesModel.findOneAndUpdate).toHaveBeenCalledWith(
			{ preference_id: "preference-1", is_deleted: false },
			{ is_deleted: true },
			{ new: true },
		);
	});

	it("returns 404 when deleting a preference that does not exist", async () => {
		(PreferencesModel.findOneAndUpdate as jest.Mock).mockResolvedValue(null);

		await expect(preferencesService.deletePreferences("missing")).resolves.toEqual({
			status: 404,
			message: "Not Found",
		});
	});

	it("reads a preference by preference_id, scoped to non-deleted rows", async () => {
		(PreferencesModel.findOne as jest.Mock).mockResolvedValue(record);

		await expect(preferencesService.getPreferencesById("preference-1")).resolves.toEqual(record);

		expect(PreferencesModel.findOne).toHaveBeenCalledWith({
			preference_id: "preference-1",
			is_deleted: false,
		});
	});

	it("updates multiple preferences by id, scoped to non-deleted rows", async () => {
		const updateResult = { modifiedCount: 2 };
		(PreferencesModel.updateMany as jest.Mock).mockResolvedValue(updateResult);

		await expect(
			preferencesService.updateMultiplePreferences(["preference-1", "preference-2"], "Live"),
		).resolves.toEqual(updateResult);

		expect(PreferencesModel.updateMany).toHaveBeenCalledWith(
			{ preference_id: { $in: ["preference-1", "preference-2"] }, is_deleted: false },
			{ status: "Live" },
		);
	});

	it.each([
		["getPreferences", () => preferencesService.getPreferences({ page: 1, limit: 10, skip: 0 })],
		["updatePreferences", () => preferencesService.updatePreferences("id", {})],
		["deletePreferences", () => preferencesService.deletePreferences("id")],
		["getPreferencesById", () => preferencesService.getPreferencesById("id")],
		["updateMultiplePreferences", () => preferencesService.updateMultiplePreferences(["id"], "Hidden")],
	])("returns a 500 service error when %s fails", async (method, operation) => {
		const modelMethod =
			method === "getPreferences"
				? "aggregate"
				: method === "updatePreferences"
					? "findOneAndUpdate"
					: method === "deletePreferences"
						? "findOneAndUpdate"
						: method === "getPreferencesById"
							? "findOne"
							: "updateMany";

		(PreferencesModel[modelMethod as keyof typeof PreferencesModel] as jest.Mock).mockRejectedValue(
			new Error("database failure"),
		);

		await expect(operation()).resolves.toEqual({
			status: 500,
			message: "database failure",
		});
	});

	it("returns a 500 service error when createPreferences fails", async () => {
		(PreferencesModel.findOne as jest.Mock).mockRejectedValue(new Error("database failure"));

		await expect(
			preferencesService.createPreferences({ category_id: "cat", brand_ids: [], priority: 1 }),
		).resolves.toEqual({ status: 500, message: "database failure" });
	});
});
