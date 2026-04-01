"use client";

import AwsS3, { type AwsBody } from "@uppy/aws-s3";
import Uppy from "@uppy/core";
import Dashboard from "@uppy/react/dashboard";
import { useState } from "react";

// import "@uppy/core/css/style.min.css";
import "@uppy/dashboard/css/style.min.css";
import { uploadService } from "@/services/upload.service";
import GoldenRetriever from "@uppy/golden-retriever";

import {
  UppyContextProvider,
  Dropzone,
  FilesList,
  UploadButton,
  useUppyContext,
  useFileInput,
} from "@uppy/react";

type Meta = {
  license?: string;
};

function createUppy() {
  const uppy = new Uppy<Meta, AwsBody>({
    autoProceed: false,
  });

  uppy.use(GoldenRetriever);

  uppy.use(AwsS3<Meta, AwsBody>, {
    shouldUseMultipart: true,
    // shouldUseMultipart: (file) => file.size > 100 * 2 ** 20,

    async createMultipartUpload(file) {
      return uploadService.createMultipartUpload({
        filename: file.name,
        filetype: file.type,
      });
    },

    async listParts(file, { uploadId, key }) {
      void file;

      return uploadService.listParts({
        uploadId: uploadService.requireUploadId(uploadId),
        key,
      });
    },

    async signPart(file, { uploadId, key, partNumber }) {
      void file;

      return uploadService.signPart({
        uploadId: uploadService.requireUploadId(uploadId),
        key,
        partNumber,
      });
    },

    async completeMultipartUpload(file, { uploadId, key, parts }) {
      void file;

      return uploadService.completeMultipartUpload({
        uploadId: uploadService.requireUploadId(uploadId),
        key,
        parts,
      });
    },

    async abortMultipartUpload(file, { uploadId, key }) {
      void file;

      await uploadService.abortMultipartUpload({
        uploadId: uploadService.requireUploadId(uploadId),
        key,
      });
    },
  });

  return uppy;
}

export default function UppyDashboard() {
  const [uppy] = useState(createUppy);

  return (
    <main className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background py-20 px-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-12 text-center space-y-4">
          <h1 className="text-4xl font-black tracking-tight sm:text-6xl bg-gradient-to-b from-foreground to-foreground/60 bg-clip-text text-transparent">
            Upload your media
          </h1>
          <p className="text-lg text-muted-foreground font-medium">
            Seamlessly upload your videos to the cloud with high-performance
            multipart streaming.
          </p>
        </div>

        <div className="uppy-Root">
          {/* <UppyContextProvider uppy={uppy}>
            <Dropzone />

            <UploadProgress />
            <UploadButton />
          </UppyContextProvider> */}

          <Dashboard uppy={uppy} />
        </div>

        <footer className="mt-20 text-center">
          <p className="text-xs font-semibold text-muted-foreground/40 uppercase tracking-[0.2em]">
            Powered by VidStack Engine
          </p>
        </footer>
      </div>
    </main>
  );
}

const UploadProgress = () => {
  const { progress, status } = useUppyContext();

  return (
    <div className="mt-12">
      <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground/60 mb-4 ml-1">
        Selected Files
      </h2>
      <div className="flex items-center gap-4">
        <div className="text-xl text-amber-400 bg-amber-100 p-2 border">
          {progress}%
        </div>
        <div className="text-xl text-amber-400 bg-amber-100 p-2 border">
          {status}
        </div>
      </div>

      <FilesList />
    </div>
  );
};
