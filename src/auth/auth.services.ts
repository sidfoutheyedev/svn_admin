import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { UserModel } from "../models/user.model";
import { CONSTANT } from "../../packages/constants";
import { signToken } from "../utils/auth";
import type { ServiceError } from "../../packages/utils";
import type {
  LoginResponse,
  UserData,
  UserRegisterResponse,
} from "./auth.type";

const registerServices = async (
  email: string,
  password: string,
): Promise<UserRegisterResponse | ServiceError> => {
  try {
    const password_hash = await bcrypt.hash(password, 10);
    const user = await UserModel.create({
      user_id: randomBytes(6).toString("hex"),
      email,
      password: password_hash,
      provider: "local",
    });

    return {
      user_id: user.user_id,
      email: user.email,
      role: user.role,
    };
  } catch (error) {
    return {
      status: CONSTANT.HTTP_STATUS.INTERNAL_SERVER_ERROR,
      message:
        error instanceof Error
          ? error.message
          : CONSTANT.STATUS.SOMETHING_WENT_WRONG,
    };
  }
};

const login = async (
  email: string,
  password: string,
): Promise<LoginResponse | ServiceError> => {
  try {
    const userCheck = await UserModel.findOne({ email }).select("+password");

    if (!userCheck) {
      return {
        status: CONSTANT.HTTP_STATUS.NOT_FOUND,
        message: CONSTANT.STATUS.NOT_FOUND,
      };
    }

    const passwordMatches = userCheck.password
      ? await bcrypt.compare(password, userCheck.password)
      : false;

    if (!passwordMatches) {
      return {
        status: CONSTANT.HTTP_STATUS.UNAUTHORIZED,
        message: CONSTANT.STATUS.UNAUTHORIZED,
      };
    }

    const token = signToken({
      user_id: userCheck.user_id,
      email: userCheck.email,
      role: userCheck.role,
    });

    return {
      user_id: userCheck.user_id,
      email: userCheck.email,
      role: userCheck.role,
      token,
    };
  } catch (error) {
    return {
      status: CONSTANT.HTTP_STATUS.INTERNAL_SERVER_ERROR,
      message:
        error instanceof Error
          ? error.message
          : CONSTANT.STATUS.SOMETHING_WENT_WRONG,
    };
  }
};

const userlogout = async (user: UserData) => {
  try {
    const updatedUser = await UserModel.findOneAndUpdate(
      { user_id: user.user_id },
      { $set: { lastLogin: new Date() } },
      { new: true },
    );

    if (!updatedUser) {
      return {
        status: CONSTANT.HTTP_STATUS.NOT_FOUND,
        message: CONSTANT.STATUS.NOT_FOUND,
      };
    }

    return {
      status: CONSTANT.HTTP_STATUS.OK,
      message: CONSTANT.STATUS.SUCCESSFUL,
      user_id: updatedUser.user_id,
    };
  } catch (error) {
    return {
      status: CONSTANT.HTTP_STATUS.INTERNAL_SERVER_ERROR,
      message:
        error instanceof Error
          ? error.message
          : CONSTANT.STATUS.SOMETHING_WENT_WRONG,
    };
  }
};

const resetPassword = async (
  user: UserData,
  confirm_password: string,
  password: string,
) => {
  try {
    const { user_id } = user;

    if (password !== confirm_password) {
      return {
        status: CONSTANT.HTTP_STATUS.BAD_REQUEST,
        message: "Password and confirm password do not match",
      };
    }

    const checkUser = await UserModel.findOne({ user_id });

    if (!checkUser) {
      return {
        status: CONSTANT.HTTP_STATUS.NOT_FOUND,
        message: CONSTANT.STATUS.NOT_FOUND,
      };
    }

    const password_hash = await bcrypt.hash(password, 10);

    await UserModel.updateOne(
      { user_id },
      { $set: { password: password_hash } },
    );

    return {
      status: CONSTANT.HTTP_STATUS.OK,
      message: CONSTANT.STATUS.SUCCESSFUL,
    };
  } catch (error) {
    return {
      status: CONSTANT.HTTP_STATUS.INTERNAL_SERVER_ERROR,
      message:
        error instanceof Error
          ? error.message
          : CONSTANT.STATUS.SOMETHING_WENT_WRONG,
    };
  }
};

export const authServiceModule = {
  registerServices,
  login,
  userlogout,
  resetPassword,
};
