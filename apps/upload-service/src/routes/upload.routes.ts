import { Router } from "express";

import {
  abortUploadController,
  completeUploadController,
  createUploadController,
  listPartsController,
  signPartController,
} from "@/controllers/upload.controller";

export const uploadRouter = Router();

uploadRouter.post("/create-upload", createUploadController);
uploadRouter.get("/list-parts", listPartsController);
uploadRouter.get("/get-upload-url", signPartController);
uploadRouter.post("/complete-upload", completeUploadController);
uploadRouter.post("/abort-upload", abortUploadController);
