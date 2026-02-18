import { Response } from "express";
import { checkStatusAndRole } from "./user.helper";
import { signJwt } from "../../utils/jwt";

import {
  findAcitveUsersProfiles,
  deleteUser,
  updateUserAccount,
  findUser,
  updateUser,
} from "./user.service";

// createing user accounts is managed in the auth module
export const handleGetUserFromRequest = async (req: any, res: Response) => {
  try {
    const user = await findUser(req.user._id, "profile");
    const token = signJwt(user);

    return res.status(200).json({ user, token });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
};
export const handleGetAllUsersProfiles = async (req: any, res: Response) => {
  try {
    const { page, pageSize } = req.query;
    const { totalCount, users } = await findAcitveUsersProfiles(
      Number(page),
      Number(pageSize)
    );
    return res.status(200).json({ totalCount, users });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
};
export const handleGetSingleUserProfile = async (req: any, res: Response) => {
  try {
    const { user_id } = req.params;
    const user = await findUser(user_id, "profile");
    return res.status(200).json({ user });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
};
export const handleGetSingleUserAccount = async (req: any, res: Response) => {
  try {
    const { user_id } = req.params;
    const user = await findUser(user_id, "account");
    return res.status(200).json({ user });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
};
export const handleDeleteUserAccount = async (req: any, res: Response) => {
  try {
    const { user_id } = req.params;
    const result = await deleteUser(user_id);
    if (!result.deletedCount) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(200).json({ message: "User account deleted" });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
};

export const handleSoftDeleteUserAccount = async (req: any, res: Response) => {
  try {
    const { user_id } = req.params;

    const user = await findUser(user_id, "account");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    await updateUserAccount({
      _id: user_id,
      status: "deleted",
    });
    return res.status(200).json({ message: "User account deleted." });
  } catch (e: any) {
    console.log(e);
    return res.status(500).json({ error: e.message });
  }
};
export const handleUpdateUserAccount = async (req: any, res: Response) => {
  try {
    const { body, connectionKey } = req;
    const { user_id } = req.params;
    // console.log(body)
    if (!body || Object.keys(body).length === 0) {
      return res.status(400).json({ error: "User data is required" });
    }

    if (!user_id) return res.status(400).json({ error: "user id is a must" });

    const { status, role, ...updateFields } = body;

    const { newUser } = body;

    console.log(newUser)
    if ((status !== undefined || role !== undefined) && newUser !== undefined) {
      return res.status(400).json({ error: "Cannot update status or role" });
    }

    if (newUser) {
      const user = await updateUser(newUser, user_id);
      if (user) {
        const token = signJwt(user.toJSON());
        return res.status(200).json({ user, token });
      }

    }else{
      const user = await updateUserAccount({
        ...updateFields,
        _id: user_id,
      });
  
      if (user) {
        const token = signJwt(user);
        return res.status(200).json({ user, token });
      }
    }

   

    return res.status(404).json({ error: "User not found" });
  } catch (e: any) {
    console.log(e.message);
    return res.status(500).json({ error: e.message });
  }
};

export const handleUpdateUserAuthorization = async (
  req: any,
  res: Response
) => {
  try {
    if (!req.body)
      return res.status(400).json({ error: "User data is required" });

    const { status, role } = req.body;
    if (!checkStatusAndRole(status, role))
      return res.status(400).json({ error: "Role or Status are required" });

    const result = await updateUserAccount(req.body);
    const user = await findUser(req.params.user_id, "profile");
    if (result.acknowledged) {
      return res.status(200).json({ user });
    }
    return res.status(404).json({ error: "User not found" });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
};
