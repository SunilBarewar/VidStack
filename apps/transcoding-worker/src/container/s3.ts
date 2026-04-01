import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import fs from "node:fs";
import path from "node:path";
import { pipeline } from "node:stream/promises";

const s3 = new S3Client({
  region: process.env.S3_BUCKET_REGION,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY!,
    secretAccessKey: process.env.S3_SECRET_KEY!,
  },
});

export async function downloadFile(
  bucket: string,
  key: string,
  outputPath: string,
) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  console.log("Downloading:", key);

  const response = await s3.send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    }),
  );

  if (!response.Body) {
    throw new Error(`S3 object "${key}" from bucket "${bucket}" has no body.`);
  }

  await pipeline(
    response.Body as NodeJS.ReadableStream,
    fs.createWriteStream(outputPath),
  );
}

export async function uploadFile(
  bucket: string,
  key: string,
  filePath: string,
) {
  const fileStream = fs.createReadStream(filePath);
  console.log("Uploading:", key);
  return s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: `processed-videos/${key}`,
      Body: fileStream,
    }),
  );
}
