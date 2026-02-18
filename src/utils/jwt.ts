import jwt from "jsonwebtoken";
import { IUser } from "../modules/user/user.model";

export const verifyJwt = async (token: string) => {
  return new Promise((resolve, reject) => {
    jwt.verify(
      token,
      String(process.env.JWT_SECRET),
      (err: any, decoded: any) => {
        if (err) {
          reject(err);
        }
        resolve(decoded);
      }
    );
  });
};

export const signJwt = (user: Partial<IUser>) => {
  return jwt.sign(user, String(process.env.JWT_SECRET), {
    expiresIn: "2w",
  });
};
