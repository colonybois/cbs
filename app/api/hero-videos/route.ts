import { NextResponse } from "next/server";
import {
  DeleteObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { requireAdmin } from "@/lib/require-admin";
import { s3Bucket, s3Client, s3PublicUrl } from "@/lib/s3";

export const runtime = "nodejs";

const HERO_PREFIX = "site-assets/hero-videos/";
const MAX_VIDEOS = 3;
const MAX_VIDEO_BYTES = 30 * 1024 * 1024;

type HeroVideoItem = {
  key: string;
  url: string;
  name: string;
  size: number;
  lastModified: string;
};

async function listHeroVideos(): Promise<HeroVideoItem[]> {
  const response = await s3Client().send(
    new ListObjectsV2Command({
      Bucket: s3Bucket(),
      Prefix: HERO_PREFIX,
    }),
  );

  return (response.Contents ?? [])
    .filter((item): item is NonNullable<typeof item> => Boolean(item.Key))
    .filter((item) => !item.Key?.endsWith("/"))
    .sort((a, b) => {
      const aTime = a.LastModified?.getTime() ?? 0;
      const bTime = b.LastModified?.getTime() ?? 0;
      return bTime - aTime;
    })
    .map((item) => ({
      key: item.Key!,
      url: s3PublicUrl(item.Key!),
      name: item.Key!.split("/").pop() || item.Key!,
      size: item.Size ?? 0,
      lastModified: item.LastModified?.toISOString() || "",
    }));
}

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-");
}

export async function GET() {
  try {
    const videos = await listHeroVideos();
    return NextResponse.json({ ok: true, videos });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unable to load hero videos.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin(request);

    const formData = await request.formData();
    const files = formData
      .getAll("videos")
      .filter((entry): entry is File => entry instanceof File && entry.size > 0);

    if (files.length === 0) throw new Error("Choose at least one video.");

    const existing = await listHeroVideos();
    if (existing.length + files.length > MAX_VIDEOS) {
      throw new Error(`You can keep up to ${MAX_VIDEOS} hero videos.`);
    }

    for (const file of files) {
      if (!file.type.startsWith("video/")) {
        throw new Error("Only video files can be uploaded.");
      }
      if (file.size > MAX_VIDEO_BYTES) {
        throw new Error("Each video must be smaller than 30 MB.");
      }
    }

    for (const file of files) {
      const key = `${HERO_PREFIX}${Date.now()}-${sanitizeFileName(file.name || "hero-video.mp4")}`;
      const bytes = Buffer.from(await file.arrayBuffer());
      await s3Client().send(
        new PutObjectCommand({
          Bucket: s3Bucket(),
          Key: key,
          Body: bytes,
          ContentType: file.type || "video/mp4",
          CacheControl: "public,max-age=3600",
        }),
      );
    }

    return NextResponse.json({ ok: true, videos: await listHeroVideos() });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unable to upload hero videos.",
      },
      { status: 400 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    await requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");
    if (!key || !key.startsWith(HERO_PREFIX)) throw new Error("Invalid hero video key.");

    await s3Client().send(
      new DeleteObjectCommand({
        Bucket: s3Bucket(),
        Key: key,
      }),
    );

    return NextResponse.json({ ok: true, videos: await listHeroVideos() });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unable to delete hero video.",
      },
      { status: 400 },
    );
  }
}
