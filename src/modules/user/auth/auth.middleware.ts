import { timingSafeEqual } from "crypto";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import { hashPassword } from "./utils";
import { findUser, findUserByEmail } from "../user.service";

export const passportLocalStrategyMiddleware = new LocalStrategy(
  {
    usernameField: "email",
    passwordField: "password",
    passReqToCallback: true,
  },
  async (req: any, email, password, done) => {
    try {
      const user = await findUserByEmail(email);

      if (!user || user.status !== "active") {
        return done(null, false, { message: "User doesn't exist." });
      }

      const { err, hash } = await hashPassword(password, String(user.salt));

      if (err || !hash) {
        return done(null, false, { message: "Invalid password." });
      }

      if (
        !timingSafeEqual(
          Buffer.from(user.hash, "hex"),
          Buffer.from(hash, "hex")
        )
      ) {
        return done(null, false, { message: "Wrong password for " + email });
      }
      return done(null, user);
    } catch (err: any) {
      return done(err);
    }
  }
);

export const passportJWTStrategyMiddleware = new JwtStrategy(
  {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: String(process.env.JWT_SECRET),
    passReqToCallback: true,
  },
  async (req: any, payload, done) => {
    try {
      const user = await findUser(payload.userId, "profile");
      if (!user) {
        return done(null, false, { message: "User not found" });
      }
      return done(null, user);
    } catch (err) {
      return done(err, false);
    }
  }
);
