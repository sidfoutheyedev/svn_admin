jest.mock("../preferences/preferences.services", () => ({
	preferencesService: {
		getPreferences: jest.fn(),
		createPreferences: jest.fn(),
		updatePreferences: jest.fn(),
		deletePreferences: jest.fn(),
		getPreferencesById: jest.fn(),
		updateMultiplePreferences: jest.fn(),
	},
}));

import { preferencesService } from "../preferences/preferences.services";
import {
	getPreferencescontroller,
	createPreferencesController,
	updatePreferencesController,
	deletePreferencesController,
	getPreferencesByIdController,
	updateMultiplePreferencesController,
} from "../preferences/preferences.controller";

const mockRes = () => {
	const res: any = {};
	res.status = jest.fn().mockReturnValue(res);
	res.send = jest.fn().mockReturnValue(res);
	return res;
};

const preference = {
	preference_id: "preference-1",
	category_id: "category-1",
	brand_ids: ["brand-1"],
	priority: 1,
	status: "Draft",
};

afterEach(() => {
	jest.clearAllMocks();
});

describe("preference controllers", () => {
	it("lists preferences with parsed pagination and query", async () => {
		(preferencesService.getPreferences as jest.Mock).mockResolvedValue([preference]);
		const req: any = { query: { page: "2", limit: "5", query: "category" } };
		const res = mockRes();

		await getPreferencescontroller(req, res, jest.fn());

		expect(preferencesService.getPreferences).toHaveBeenCalledWith({
			page: 2,
			limit: 5,
			skip: 5,
			query: "category",
		});
		expect(res.status).toHaveBeenCalledWith(200);
	});

	it("creates a preference", async () => {
		(preferencesService.createPreferences as jest.Mock).mockResolvedValue(preference);
		const req: any = { body: preference };
		const res = mockRes();

		await createPreferencesController(req, res, jest.fn());

		expect(preferencesService.createPreferences).toHaveBeenCalledWith(preference);
		expect(res.status).toHaveBeenCalledWith(201);
	});

	it("updates a preference using the query id", async () => {
		(preferencesService.updatePreferences as jest.Mock).mockResolvedValue(preference);
		const body = { priority: 2 };
		const req: any = { query: { preference_id: "preference-1" }, body };
		const res = mockRes();

		await updatePreferencesController(req, res, jest.fn());

		expect(preferencesService.updatePreferences).toHaveBeenCalledWith(
			"preference-1",
			body,
		);
		expect(res.status).toHaveBeenCalledWith(200);
	});

	it("deletes a preference using the query id", async () => {
		(preferencesService.deletePreferences as jest.Mock).mockResolvedValue(preference);
		const req: any = { query: { preference_id: "preference-1" } };
		const res = mockRes();

		await deletePreferencesController(req, res, jest.fn());

		expect(preferencesService.deletePreferences).toHaveBeenCalledWith("preference-1");
		expect(res.status).toHaveBeenCalledWith(200);
	});

	it("gets one preference using the query id", async () => {
		(preferencesService.getPreferencesById as jest.Mock).mockResolvedValue(preference);
		const req: any = { query: { preference_id: "preference-1" } };
		const res = mockRes();

		await getPreferencesByIdController(req, res, jest.fn());

		expect(preferencesService.getPreferencesById).toHaveBeenCalledWith("preference-1");
		expect(res.status).toHaveBeenCalledWith(200);
	});

	it("updates multiple preferences using body values", async () => {
		(preferencesService.updateMultiplePreferences as jest.Mock).mockResolvedValue({
			modifiedCount: 2,
		});
		const req: any = {
			body: { preference_ids: ["preference-1", "preference-2"], status: "Live" },
		};
		const res = mockRes();

		await updateMultiplePreferencesController(req, res, jest.fn());

		expect(preferencesService.updateMultiplePreferences).toHaveBeenCalledWith(
			["preference-1", "preference-2"],
			"Live",
		);
		expect(res.status).toHaveBeenCalledWith(200);
	});

	it.each([
		["getPreferences", getPreferencescontroller, { query: {} }],
		["createPreferences", createPreferencesController, { body: preference }],
		["updatePreferences", updatePreferencesController, { query: { preference_id: "id" }, body: {} }],
		["deletePreferences", deletePreferencesController, { query: { preference_id: "id" } }],
		["getPreferencesById", getPreferencesByIdController, { query: { preference_id: "id" } }],
		["updateMultiplePreferences", updateMultiplePreferencesController, { body: { preference_ids: ["id"], status: "Draft" } }],
	])("returns a service error from %s", async (method, controller, req) => {
		(preferencesService[method as keyof typeof preferencesService] as jest.Mock).mockResolvedValue({
			status: 404,
			message: "Not Found",
		});
		const res = mockRes();

		await (controller as Function)(req, res, jest.fn());

		expect(res.status).toHaveBeenCalledWith(404);
	});
});
