import { verifyJwt } from "../utils/jwt";

export const verifyUser = async (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decodedToken = await verifyJwt(token);
    req.user = decodedToken; //  Attach the decoded token to req.user

    if (req.user.status !== "active") {
      throw new Error("Unauthorized");
    }
    return next();
  } catch (err) {
    return res.status(401).json({ error: "Unauthorized" });
  }
};

export const verifyAdmin = async (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decodedToken = await verifyJwt(token);
    req.user = decodedToken; //  Attach the decoded token to req.user

    if (req.user.role !== "admin") {
      throw new Error("Forbidden");
    }
    return next();
  } catch (err) {
    return res.status(401).json({ error: "Unauthorized" });
  }
};
