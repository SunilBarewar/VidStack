import type { AwsBody, AwsS3Part, AwsS3UploadParameters } from "@uppy/aws-s3";

import { getApiData, uploadApiClient } from "@/lib/api";

export type CreateMultipartUploadPayload = {
  filename: string;
  filetype?: string;
};

export type CreateMultipartUploadResponse = {
  bucket: string;
  key: string;
  uploadId: string;
};

export type ListPartsParams = {
  key: string;
  uploadId: string;
};

export type SignPartParams = {
  key: string;
  partNumber: number;
  uploadId: string;
};

export type CompleteMultipartUploadPayload = {
  key: string;
  parts: AwsS3Part[];
  uploadId: string;
};

export type AbortMultipartUploadPayload = {
  key: string;
  uploadId: string;
};

function requireUploadId(uploadId?: string) {
  if (!uploadId) {
    throw new Error("Missing multipart upload ID");
  }

  return uploadId;
}

export const uploadService = {
  createMultipartUpload(payload: CreateMultipartUploadPayload) {
    return getApiData(
      uploadApiClient.post<CreateMultipartUploadResponse>(
        "/create-upload",
        payload,
      ),
    );
  },

  listParts(params: ListPartsParams) {
    return getApiData(
      uploadApiClient.get<AwsS3Part[]>("/list-parts", {
        params,
      }),
    );
  },

  signPart(params: SignPartParams) {
    return getApiData(
      uploadApiClient.get<AwsS3UploadParameters>("/get-upload-url", {
        params,
      }),
    );
  },

  completeMultipartUpload(payload: CompleteMultipartUploadPayload) {
    return getApiData(
      uploadApiClient.post<AwsBody>("/complete-upload", payload),
    );
  },

  async abortMultipartUpload(payload: AbortMultipartUploadPayload) {
    await uploadApiClient.post("/abort-upload", payload);
  },

  requireUploadId,
};
