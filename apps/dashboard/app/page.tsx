"use client";

import AwsS3, { type AwsBody } from "@uppy/aws-s3";
import Uppy from "@uppy/core";
import Dashboard from "@uppy/react/dashboard";
import { useState } from "react";

import "@uppy/core/css/style.min.css";
import "@uppy/dashboard/css/style.min.css";
import { uploadService } from "@/services/upload.service";
import GoldenRetriever from "@uppy/golden-retriever";

import {
  UppyContextProvider,
  Dropzone,
  FilesList,
  UploadButton,
  useUppyContext,
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
    <UppyContextProvider uppy={uppy}>
      <Dropzone />
      <FilesList />
      <UploadButton />

      {/* {uploadProgress()} */}
    </UppyContextProvider>
  );
}

const uploadProgress = () => {
  const { progress, status } = useUppyContext();

  return (
    <div>
      <div className="text-xl text-amber-400">{progress}%</div>
      <div className="text-2xl text-green-200">{status}</div>
    </div>
  );
};
