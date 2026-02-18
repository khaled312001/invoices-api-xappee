import { IUser } from "../user.model";
import { signJwt } from "../../../utils/jwt";
import { addUser } from "../user.service";

export const createUserAndToken = async (userData: Partial<IUser>) => {
  const newUser = await addUser({
    ...userData,
    status: "active",
  });

  const token = signJwt({
    _id: newUser._id,
    name: newUser.name,
    email: newUser.email,
    role: newUser.role,
    tenant_names: newUser.tenant_names,
    status: newUser.status,
  });

  return { token, user: newUser };
};
