import { pbkdf2, randomBytes } from "crypto";
import { promisify } from "util";

export const generateSalt = () => {
  return randomBytes(64).toString("hex");
};

const pbkdf2Promise = promisify(pbkdf2);

export const hashPassword = async (
  passwordText: string,
  salt: string
): Promise<{ err: any; hash: string | null }> => {
  try {
    const hash = await pbkdf2Promise(passwordText, salt, 310000, 32, "sha256");
    return { err: null, hash: hash.toString("hex") }; // Convert Buffer to hex string
  } catch (err) {
    return { err, hash: null };
  }
};
