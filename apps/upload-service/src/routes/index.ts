import { Router } from "express";
import { uploadRouter } from "./upload.routes";

export const apiRouter = Router();

apiRouter.use("/upload", uploadRouter);
