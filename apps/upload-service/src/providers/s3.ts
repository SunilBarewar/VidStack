import {
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  ListPartsCommand,
  S3Client,
  UploadPartCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { env } from "@/config/env";

type CompletedMultipartPart = {
  ETag: string;
  PartNumber: number;
};

type MultipartUploadInitResult = {
  bucket: string;
  key: string;
  uploadId: string;
};

type SignedPartUploadResult = {
  expires: number;
  headers: Record<string, string>;
  method: "PUT";
  url: string;
};

type CompletedMultipartUploadResult = {
  bucket: string;
  key: string;
  location: string;
};

export class StorageService {
  private readonly provider: S3Provider;

  constructor() {
    this.provider = new S3Provider();
  }

  createMultipartUpload(
    fileName: string,
    contentType?: string,
  ): Promise<MultipartUploadInitResult> {
    return this.provider.createMultipartUpload(fileName, contentType);
  }

  listParts(uploadId: string, key: string) {
    return this.provider.listParts(uploadId, key);
  }

  signPart(uploadId: string, key: string, partNumber: number) {
    return this.provider.signPart(uploadId, key, partNumber);
  }

  completeMultipartUpload(
    uploadId: string,
    key: string,
    parts: CompletedMultipartPart[],
  ): Promise<CompletedMultipartUploadResult> {
    return this.provider.completeMultipartUpload(uploadId, key, parts);
  }

  abortMultipartUpload(uploadId: string, key: string): Promise<void> {
    return this.provider.abortMultipartUpload(uploadId, key);
  }
}

class S3Provider {
  private readonly bucketName = env.S3_BUCKET_NAME;

  private readonly client: S3Client;

  constructor() {
    this.client = new S3Client({
      region: env.S3_BUCKET_REGION,
      credentials: {
        accessKeyId: env.S3_ACCESS_KEY,
        secretAccessKey: env.S3_SECRET_KEY,
      },
    });
  }

  async createMultipartUpload(
    fileName: string,
    contentType?: string,
  ): Promise<MultipartUploadInitResult> {
    const key = this.buildObjectKey(fileName);
    const command = new CreateMultipartUploadCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: contentType ?? "application/octet-stream",
    });

    const response = await this.client.send(command);

    if (response.UploadId === undefined || response.Key === undefined) {
      throw new Error("Failed to create multipart upload");
    }

    return {
      bucket: this.bucketName,
      key: response.Key,
      uploadId: response.UploadId,
    };
  }

  async listParts(uploadId: string, key: string) {
    const response = await this.client.send(
      new ListPartsCommand({
        Bucket: this.bucketName,
        Key: key,
        UploadId: uploadId,
      }),
    );

    return response.Parts ?? [];
  }

  async signPart(
    uploadId: string,
    key: string,
    partNumber: number,
  ): Promise<SignedPartUploadResult> {
    const command = new UploadPartCommand({
      Bucket: this.bucketName,
      Key: key,
      PartNumber: partNumber,
      UploadId: uploadId,
    });

    const expiresInSeconds = 60 * 15;
    const url = await getSignedUrl(this.client, command, {
      expiresIn: expiresInSeconds,
    });

    return {
      method: "PUT",
      url,
      expires: expiresInSeconds,
      headers: {},
    };
  }

  async completeMultipartUpload(
    uploadId: string,
    key: string,
    parts: CompletedMultipartPart[],
  ): Promise<CompletedMultipartUploadResult> {
    const response = await this.client.send(
      new CompleteMultipartUploadCommand({
        Bucket: this.bucketName,
        Key: key,
        UploadId: uploadId,
        MultipartUpload: {
          Parts: [...parts].sort((a, b) => a.PartNumber - b.PartNumber),
        },
      }),
    );

    return {
      bucket: this.bucketName,
      key,
      location:
        response.Location ??
        `https://${this.bucketName}.s3.${env.S3_BUCKET_REGION}.amazonaws.com/${key}`,
    };
  }

  async abortMultipartUpload(uploadId: string, key: string): Promise<void> {
    await this.client.send(
      new AbortMultipartUploadCommand({
        Bucket: this.bucketName,
        Key: key,
        UploadId: uploadId,
      }),
    );
  }

  private buildObjectKey(fileName: string) {
    const normalizedName = fileName
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-zA-Z0-9._-]/g, "")
      .replace(/^-+|-+$/g, "");

    const safeName = normalizedName;

    return `uploads/${Date.now()}-${safeName}`;
  }
}
