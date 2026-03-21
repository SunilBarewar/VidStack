import type { NextFunction, Request, Response } from "express";

export const authMiddleware = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    next();
  };
};
