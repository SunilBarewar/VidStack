import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { downloadFile, uploadFile } from "./s3.js";
import { transcodeVariant, type VariantSpec } from "./transcoder.js";

const INPUT_BUCKET = process.env.S3_BUCKET_NAME!;
const OUTPUT_BUCKET = process.env.S3_BUCKET_NAME!;

const HLS_VARIANTS: VariantSpec[] = [
  {
    name: "360p",
    resolution: "640x360",
    bitrate: "800k",
    maxrate: "856k",
  },
  {
    name: "480p",
    resolution: "854x480",
    bitrate: "1400k",
    maxrate: "1498k",
  },
  {
    name: "720p",
    resolution: "1280x720",
    bitrate: "2800k",
    maxrate: "2996k",
  },
];

function createMasterPlaylist(variants: VariantSpec[]) {
  const lines = ["#EXTM3U", "#EXT-X-VERSION:3"];

  for (const variant of variants) {
    const bandwidth = Number.parseInt(variant.maxrate, 10) * 1000;
    lines.push(
      `#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},RESOLUTION=${variant.resolution}`,
      `${variant.name}/${variant.name}.m3u8`,
    );
  }

  return `${lines.join("\n")}\n`;
}

async function processJob(job: any) {
  const { videoId, s3Key } = job;
  console.log("Payload:", job);

  const jobDir = path.join(os.tmpdir(), videoId);
  const inputPath = path.join(jobDir, `${videoId}.mp4`);

  console.log("Processing:", videoId);
  fs.mkdirSync(jobDir, { recursive: true });

  await downloadFile(INPUT_BUCKET, s3Key, inputPath);

  for (const variant of HLS_VARIANTS) {
    const variantDir = path.join(jobDir, variant.name);

    await transcodeVariant(inputPath, variantDir, variant);

    const variantFiles = fs.readdirSync(variantDir);

    for (const fileName of variantFiles) {
      const filePath = path.join(variantDir, fileName);

      await uploadFile(
        OUTPUT_BUCKET,
        `${videoId}/${variant.name}/${fileName}`,
        filePath,
      );
    }
  }

  const masterPlaylistPath = path.join(jobDir, "index.m3u8");

  fs.writeFileSync(masterPlaylistPath, createMasterPlaylist(HLS_VARIANTS));

  // Uploading master playlist
  await uploadFile(OUTPUT_BUCKET, `${videoId}/index.m3u8`, masterPlaylistPath);

  fs.rmSync(jobDir, { recursive: true, force: true });

  console.log("Done:", videoId);

  return true;
}

async function main() {
  try {
    const videoId = process.env.VIDEO_ID;
    const s3Key = process.env.S3_KEY;

    if (!videoId || !s3Key) {
      throw new Error("VIDEO_ID or S3_KEY is not defined");
    }

    await processJob({ videoId, s3Key });
    process.exit(0);
  } catch (err) {
    console.log("Error:", err);
    process.exit(1);
  }
}

main();

// node dist/src/index.js '{"videoId":"test-1","s3Key":"uploads/1774175487151-Push-notification-demo.mp4"}'

// docker run --rm transcoder-worker '{"videoId":"test-doc-1","s3Key":"uploads/1774175487151-Push-notification-demo.mp4"}'
