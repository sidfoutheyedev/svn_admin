import { randomBytes } from "crypto";
import type { NextFunction, Request, Response } from "express";

import * as handlersModule from "../../packages/handlers/index";
import * as constantsModule from "../../packages/constants/index";
import * as utilsModule from "../../packages/utils/index";
import * as authUtilModule from "../utils/auth";
import * as firebaseModule from "../../packages/firebase/index";

import { UserModel } from "../models/user.model";
import type {
  UserCredentials,
  ApiResponse,
  LoginResponse,
  UserRegisterResponse,
  UserData,
} from "./auth.type";
import { authServiceModule } from "./auth.services";

const { successHandler, errorHandler } = handlersModule;
const { CONSTANT } = constantsModule;
const { isServiceError } = utilsModule;
const { signToken, isProviderMatch } = authUtilModule;
const { verifyFirebaseIdToken } = firebaseModule.FirebaseManager;

// Helpers Function
const findUserByEmail = (email: string) => UserModel.findOne({ email });

const findUserByFirebaseUid = (firebaseUid: string) =>
  UserModel.findOne({ firebaseUid });

const createUser = (data: Record<string, unknown>) => UserModel.create(data);

const updateLastLogin = (id: unknown) =>
  UserModel.findByIdAndUpdate(id, { lastLogin: new Date() }, { new: true });

export const register = async (
  req: Request<{}, {}, UserCredentials>,
  res: Response<ApiResponse<UserRegisterResponse>>,
  next: NextFunction,
) => {
  try {
    const { email, password } = req.body;

    const existing = await findUserByEmail(email);

    if (existing) {
      return errorHandler(
        {
          status: CONSTANT.HTTP_STATUS.CONFLICT,
          message: CONSTANT.PAYLOAD.RECORD_ALREADY_EXIST,
        },
        req,
        res,
      );
    }

    const data = await authServiceModule.registerServices(email, password);

    if (isServiceError(data)) {
      return errorHandler(data, req, res);
    }

    return successHandler(
      {
        status: CONSTANT.HTTP_STATUS.CREATED,
        message: CONSTANT.PAYLOAD.RECORD_CREATED_SUCCESSFULLY,
        data,
      },
      req,
      res,
    );
  } catch (error) {
    return errorHandler(
      {
        status: CONSTANT.HTTP_STATUS.INTERNAL_SERVER_ERROR,
        message:
          error instanceof Error
            ? error.message
            : CONSTANT.STATUS.SOMETHING_WENT_WRONG,
      },
      req,
      res,
    );
  }
};

export const login = async (
  req: Request<{}, {}, UserCredentials>,
  res: Response<ApiResponse<LoginResponse>>,
  next: NextFunction,
) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return errorHandler(
        {
          status: CONSTANT.HTTP_STATUS.BAD_REQUEST,
          message: "Email and password are required",
        },
        req,
        res,
      );
    }

    const data = await authServiceModule.login(email, password);

    if (isServiceError(data)) {
      return errorHandler(data, req, res);
    }

    return successHandler(
      {
        status: CONSTANT.HTTP_STATUS.OK,
        message: CONSTANT.STATUS.SUCCESSFUL,
        data,
      },
      req,
      res,
    );
  } catch (error) {
    return errorHandler(
      {
        status: CONSTANT.HTTP_STATUS.INTERNAL_SERVER_ERROR,
        message:
          error instanceof Error
            ? error.message
            : CONSTANT.STATUS.SOMETHING_WENT_WRONG,
      },
      req,
      res,
    );
  }
};

export const social = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { idToken, provider } = req.body;

    let decoded;

    try {
      decoded = await verifyFirebaseIdToken(idToken);
    } catch {
      return errorHandler(
        {
          status: CONSTANT.HTTP_STATUS.UNAUTHORIZED,
          message: CONSTANT.STATUS.INVALID_SOCIAL_TOKEN,
        },
        req,
        res,
      );
    }

    if (!isProviderMatch(decoded.firebase?.sign_in_provider, provider)) {
      return errorHandler(
        {
          status: CONSTANT.HTTP_STATUS.BAD_REQUEST,
          message: CONSTANT.STATUS.SOCIAL_PROVIDER_MISMATCH,
        },
        req,
        res,
      );
    }

    if (!decoded.email) {
      return errorHandler(
        {
          status: CONSTANT.HTTP_STATUS.UNPROCESSABLE_ENTITY,
          message: CONSTANT.STATUS.SOCIAL_EMAIL_MISSING,
        },
        req,
        res,
      );
    }

    let user = await findUserByFirebaseUid(decoded.uid);

    if (!user) {
      user = await findUserByEmail(decoded.email);
    }

    if (!user) {
      user = await createUser({
        user_id: randomBytes(6).toString("hex"),
        email: decoded.email,
        name: decoded.name,
        provider,
        firebaseUid: decoded.uid,
      });
    } else if (!user.firebaseUid) {
      user.firebaseUid = decoded.uid;
      user.provider = provider;

      await user.save();
    }

    await updateLastLogin(user._id);

    const token = signToken({
      user_id: user.user_id,
      email: user.email,
      role: user.role,
    });

    return successHandler(
      {
        status: CONSTANT.HTTP_STATUS.OK,
        message: CONSTANT.PAYLOAD.SOCIAL_LOGIN_SUCCESSFUL,
        data: {
          token,
          user,
        },
      },
      req,
      res,
    );
  } catch (error) {
    return errorHandler(
      {
        status: CONSTANT.HTTP_STATUS.INTERNAL_SERVER_ERROR,
        message:
          error instanceof Error
            ? error.message
            : CONSTANT.STATUS.SOMETHING_WENT_WRONG,
      },
      req,
      res,
    );
  }
};

export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { confirm_password, password } = req.body;

    const user: UserData | null = authUtilModule.getAuthenticatedUserId(req);

    if (!user) {
      return errorHandler(
        {
          status: CONSTANT.HTTP_STATUS.UNAUTHORIZED,
          message: CONSTANT.STATUS.UNAUTHORIZED,
        },
        req,
        res,
      );
    }

    const data = await authServiceModule.resetPassword(
      user,
      confirm_password,
      password,
    );

    return successHandler(
      {
        status: CONSTANT.HTTP_STATUS.OK,
        message: CONSTANT.STATUS.SUCCESSFUL,
        data,
      },
      req,
      res,
    );
  } catch (error) {
    return errorHandler(
      {
        status: CONSTANT.HTTP_STATUS.INTERNAL_SERVER_ERROR,
        message:
          error instanceof Error
            ? error.message
            : CONSTANT.STATUS.SOMETHING_WENT_WRONG,
      },
      req,
      res,
    );
  }
};

export const Userlogout = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user: UserData | null = authUtilModule.getAuthenticatedUserId(req);

    if (!user) {
      return errorHandler(
        {
          status: CONSTANT.HTTP_STATUS.UNAUTHORIZED,
          message: CONSTANT.STATUS.UNAUTHORIZED,
        },
        req,
        res,
      );
    }

    const data = await authServiceModule.userlogout(user);

    return successHandler(
      {
        status: CONSTANT.HTTP_STATUS.OK,
        message: CONSTANT.STATUS.SUCCESSFUL,
        data,
      },
      req,
      res,
    );
  } catch (error) {
    return errorHandler(
      {
        status: CONSTANT.HTTP_STATUS.INTERNAL_SERVER_ERROR,
        message:
          error instanceof Error
            ? error.message
            : CONSTANT.STATUS.SOMETHING_WENT_WRONG,
      },
      req,
      res,
    );
  }
};
