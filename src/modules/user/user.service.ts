import { IUser, User } from "./user.model";

export async function addUser(userData: Partial<IUser>): Promise<IUser | any> {
  const userExists = await User.findOne({ email: userData.email });
  if (userExists) {
    throw new Error("User already exists");
  }
  const user = new User(userData);
  return user.save();
}

export async function findAcitveUsersProfiles(
  page: number = 1,
  pageSize: number = 20
): Promise<{ users: any[]; totalCount: number }> {
  const skip = (page - 1) * pageSize;
  const [users, totalCount] = await Promise.all([
    User.find(
      { status: "active" },
      "name email username status role tenant_ids tenant_names image client"
    )
      .lean()
      .skip(skip)
      .limit(pageSize)
      .exec(),
    User.countDocuments({}),
  ]);

  return { users, totalCount };
}

export async function findUser(
  userId: string,
  type: "profile" | "account"
): Promise<any> {
  const projection =
    type === "profile"
      ? "name email username status role tenant_ids tenant_names image"
      : "";

  return User.findOne({ _id: userId, status: "active" }, projection).lean();
}

export async function deleteUser(userId: string): Promise<any> {
  return await User.deleteOne({ _id: userId }).exec();
}

export async function updateUserAccount(user: Partial<IUser>): Promise<any> {
  return User.findOneAndUpdate({ _id: user._id }, user).exec();
}

export async function updateUser(user: any,id: string): Promise<any> {
  console.log("id", id );
  console.log("user", user );

  return User.findOneAndUpdate({ _id: id }, user).exec();
}

export async function findUserByEmail(email: string): Promise<IUser | any> {
  return User.findOne({ email }).lean();
}
