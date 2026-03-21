import type { Request, Response } from "express";
import { z } from "zod";

import { StorageService } from "@/providers/s3";
import { logger } from "@/utils/logger";

const storageService = new StorageService();

const createUploadSchema = z.object({
  filename: z.string().min(1),
  filetype: z.string().optional(),
});

const listPartsSchema = z.object({
  key: z.string().min(1),
  uploadId: z.string().min(1),
});

const signPartSchema = z.object({
  key: z.string().min(1),
  uploadId: z.string().min(1),
  partNumber: z.coerce.number().int().positive(),
});

const multipartPartSchema = z.object({
  ETag: z.string().min(1),
  PartNumber: z.number().int().positive(),
});

const completeUploadSchema = z.object({
  key: z.string().min(1),
  uploadId: z.string().min(1),
  parts: z.array(multipartPartSchema).min(1),
});

const abortUploadSchema = z.object({
  key: z.string().min(1),
  uploadId: z.string().min(1),
});

function handleUploadError(
  error: unknown,
  res: Response,
  message: string,
): Response {
  logger.error(message, error);

  if (error instanceof z.ZodError) {
    return res.status(400).json({
      error: "Invalid request payload",
      details: error.flatten(),
    });
  }

  return res.status(500).json({ error: message });
}

export async function createUploadController(req: Request, res: Response) {
  try {
    const { filename, filetype } = createUploadSchema.parse(req.body);
    const result = await storageService.createMultipartUpload(
      filename,
      filetype,
    );

    return res.json(result);
  } catch (error) {
    return handleUploadError(error, res, "Failed to create multipart upload");
  }
}

export async function listPartsController(req: Request, res: Response) {
  try {
    const { uploadId, key } = listPartsSchema.parse(req.query);
    const parts = await storageService.listParts(uploadId, key);

    return res.json(parts);
  } catch (error) {
    return handleUploadError(
      error,
      res,
      "Failed to list multipart upload parts",
    );
  }
}

export async function signPartController(req: Request, res: Response) {
  try {
    const { uploadId, key, partNumber } = signPartSchema.parse(req.query);
    const result = await storageService.signPart(uploadId, key, partNumber);

    return res.json(result);
  } catch (error) {
    return handleUploadError(error, res, "Failed to sign multipart upload part");
  }
}

export async function completeUploadController(req: Request, res: Response) {
  try {
    const { uploadId, key, parts } = completeUploadSchema.parse(req.body);
    const result = await storageService.completeMultipartUpload(
      uploadId,
      key,
      parts,
    );

    return res.json(result);
  } catch (error) {
    return handleUploadError(error, res, "Failed to complete multipart upload");
  }
}

export async function abortUploadController(req: Request, res: Response) {
  try {
    const { uploadId, key } = abortUploadSchema.parse(req.body);

    await storageService.abortMultipartUpload(uploadId, key);

    return res.status(204).send();
  } catch (error) {
    return handleUploadError(error, res, "Failed to abort multipart upload");
  }
}
