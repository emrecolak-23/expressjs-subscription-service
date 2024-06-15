import { Request, Response, NextFunction } from "express";
import { UserTypes } from "../types/user";

export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  const { role } = req.currentUser;
  if (role === UserTypes.ROLE_ADMIN) {
    return next();
  }
  return res
    .status(403)
    .json({ message: "You are not allowed to access this resource" });
};
