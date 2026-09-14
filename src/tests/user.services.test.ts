jest.mock("../models/user.model", () => ({
    UserModel: {
        aggregate: jest.fn(),
        collection: { name: "users" },
    },
}));

jest.mock("../models/profile.model", () => ({
    UserProfileModel: { collection: { name: "userprofiles" } },
}));

jest.mock("../models/preferences.model", () => ({
    PreferencesModel: { collection: { name: "preferences" } },
}));

jest.mock("../models/category.model", () => ({
    CategoryModel: { collection: { name: "categories" } },
}));

jest.mock("../models/user_preferences.model", () => ({
    __esModule: true,
    default: { aggregate: jest.fn() },
}));

import { UserModel } from "../models/user.model";
import UserPreferencesModel from "../models/user_preferences.model";
import { userService } from "../user/user.services";

const userDetails = {
    user_id: "user-1",
    email: "user@example.com",
    role: "user",
    provider: "local",
};

afterEach(() => {
    jest.clearAllMocks();
});

describe("getUserDetails style_dna", () => {
    it("returns score-weighted percentages sorted by score", async () => {
        (UserModel.aggregate as jest.Mock).mockResolvedValue([userDetails]);
        (UserPreferencesModel.aggregate as jest.Mock).mockResolvedValue([
            {
                rows: [
                    { preference_id: "pref-1", score: 5, label: "streetwear", description: "Bold textures" },
                    { preference_id: "pref-2", score: 3, label: "minimalist", description: "Clean lines" },
                    { preference_id: "pref-3", score: 2, label: "avant-garde", description: "Statement pieces" },
                ],
            },
        ]);

        const result: any = await userService.getUserDetails("user-1");

        expect(result.style_dna).toEqual({
            slices: [
                { preference_id: "pref-1", label: "streetwear", score: 5, percentage: 50 },
                { preference_id: "pref-2", label: "minimalist", score: 3, percentage: 30 },
                { preference_id: "pref-3", label: "avant-garde", score: 2, percentage: 20 },
            ],
            note: "Bold textures",
        });
    });

    it("distributes the rounding remainder to the largest fractional shares so percentages sum to 100", async () => {
        (UserModel.aggregate as jest.Mock).mockResolvedValue([userDetails]);
        (UserPreferencesModel.aggregate as jest.Mock).mockResolvedValue([
            {
                rows: [
                    { preference_id: "pref-1", score: 1, label: "streetwear", description: null },
                    { preference_id: "pref-2", score: 1, label: "minimalist", description: null },
                    { preference_id: "pref-3", score: 1, label: "avant-garde", description: null },
                ],
            },
        ]);

        const result: any = await userService.getUserDetails("user-1");

        const percentages = result.style_dna.slices.map((slice: any) => slice.percentage);
        expect(percentages.reduce((sum: number, value: number) => sum + value, 0)).toBe(100);
        expect(percentages).toEqual([34, 33, 33]);
    });

    it("returns an empty style_dna without failing when the user has no UserPreferences doc", async () => {
        (UserModel.aggregate as jest.Mock).mockResolvedValue([userDetails]);
        (UserPreferencesModel.aggregate as jest.Mock).mockResolvedValue([]);

        const result: any = await userService.getUserDetails("user-1");

        expect(result.style_dna).toEqual({ slices: [], note: null });
    });

    it("returns all-zero percentages instead of dividing by zero when every score is 0", async () => {
        (UserModel.aggregate as jest.Mock).mockResolvedValue([userDetails]);
        (UserPreferencesModel.aggregate as jest.Mock).mockResolvedValue([
            {
                rows: [
                    { preference_id: "pref-1", score: 0, label: "streetwear", description: "Bold textures" },
                    { preference_id: "pref-2", score: 0, label: "minimalist", description: "Clean lines" },
                ],
            },
        ]);

        const result: any = await userService.getUserDetails("user-1");

        expect(result.style_dna.slices.map((slice: any) => slice.percentage)).toEqual([0, 0]);
    });

    it("returns 404 without style_dna when the user does not exist", async () => {
        (UserModel.aggregate as jest.Mock).mockResolvedValue([]);
        (UserPreferencesModel.aggregate as jest.Mock).mockResolvedValue([]);

        const result = await userService.getUserDetails("missing-user");

        expect(result).toEqual({ status: 404, message: "Not Found" });
    });
});
