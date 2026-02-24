import { Response, Request, NextFunction } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";

export const isAuthorizedUser = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const token =
      req.cookies?.token ||
      req.header("Authorization")?.replace("Bearer ", "") ||
      req.header("authorization")?.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({ message: "token not provided" });
    }
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ message: "secret is missing provided" });
    }
    const decode = jwt.verify(token, secret) as JwtPayload;
    req.user = decode;
    next();
  } catch (error) {
    console.error("JWT verification failed:", error);
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};
