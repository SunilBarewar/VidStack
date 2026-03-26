import fs from "node:fs";
import path from "node:path";

import ffmpegPath from "ffmpeg-static";
import ffmpeg from "fluent-ffmpeg";

const resolvedFfmpegPath =
  ffmpegPath && fs.existsSync(ffmpegPath) ? ffmpegPath : "ffmpeg";

ffmpeg.setFfmpegPath(resolvedFfmpegPath);

export type VariantSpec = {
  bitrate: string;
  maxrate: string;
  name: string;
  resolution: string;
};

export function transcodeVariant(
  input: string,
  outputDir: string,
  variant: VariantSpec,
) {
  fs.mkdirSync(outputDir, { recursive: true });

  const playlistPath = path.join(outputDir, `${variant.name}.m3u8`);
  const segmentPath = path.join(outputDir, `${variant.name}_%03d.ts`);

  return new Promise((resolve, reject) => {
    ffmpeg(input)
      .videoCodec("libx264")
      .audioCodec("aac")
      .size(variant.resolution)
      .outputOptions([
        "-preset veryfast",
        "-crf 23",
        "-g 48",
        "-keyint_min 48",
        "-sc_threshold 0",
        `-b:v ${variant.bitrate}`,
        `-maxrate ${variant.maxrate}`,
        `-bufsize ${variant.maxrate}`,
        "-b:a 128k",
        "-hls_segment_type mpegts",
        "-hls_time 10",
        "-hls_playlist_type vod",
        `-hls_segment_filename ${segmentPath}`,
      ])
      .output(playlistPath)
      .on("end", resolve)
      .on("error", reject)
      .run();
  });
}
