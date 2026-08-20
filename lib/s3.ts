import "server-only";

import { S3Client } from "@aws-sdk/client-s3";

const region = process.env.AWS_REGION?.trim();
const bucket = process.env.AWS_S3_BUCKET?.trim();
const accessKeyId = process.env.AWS_ACCESS_KEY_ID?.trim();
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY?.trim();

function requireEnv(value: string | undefined, name: string) {
  if (!value) throw new Error(`${name} is not configured.`);
  return value;
}

export function s3Client() {
  return new S3Client({
    region: requireEnv(region, "AWS_REGION"),
    credentials: {
      accessKeyId: requireEnv(accessKeyId, "AWS_ACCESS_KEY_ID"),
      secretAccessKey: requireEnv(secretAccessKey, "AWS_SECRET_ACCESS_KEY"),
    },
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });
}

export function s3Bucket() {
  return requireEnv(bucket, "AWS_S3_BUCKET");
}

export function s3PublicUrl(key: string) {
  const publicBaseUrl = process.env.AWS_S3_PUBLIC_BASE_URL?.trim();
  if (publicBaseUrl) return `${publicBaseUrl.replace(/\/$/, "")}/${key}`;
  return `https://${s3Bucket()}.s3.${requireEnv(region, "AWS_REGION")}.amazonaws.com/${key}`;
}
