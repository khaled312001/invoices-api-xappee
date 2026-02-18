import express from "express";
import {
  handleDeleteUserAccount,
  handleGetAllUsersProfiles,
  handleGetSingleUserAccount,
  handleGetSingleUserProfile,
  handleUpdateUserAccount,
  handleGetUserFromRequest,
  handleUpdateUserAuthorization,
  handleSoftDeleteUserAccount,
} from "./user.controller";

export * from "./user.controller";
export * from "./user.helper";
export * from "./user.model";
export * from "./user.service";

export const userRouter = express.Router();
userRouter.use(express.json());
userRouter.get("/", handleGetAllUsersProfiles);
userRouter.get("/me", handleGetUserFromRequest);

userRouter.get("/:user_id/profile", handleGetSingleUserProfile);

// only the user can access their account
userRouter.get("/:user_id/account", handleGetSingleUserAccount);
userRouter.put("/:user_id", handleUpdateUserAccount);

userRouter.put("/:user_id/authorization", handleUpdateUserAuthorization);

userRouter.delete("/:user_id/account", handleSoftDeleteUserAccount);

userRouter.delete("/:user_id/account/hard", handleDeleteUserAccount);
