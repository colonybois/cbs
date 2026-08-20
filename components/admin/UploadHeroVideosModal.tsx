"use client";

import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import type { HeroVideo } from "@/components/hero/HeroVideoCarousel";

const MAX_VIDEOS = 3;
const MAX_FILE_SIZE = 30 * 1024 * 1024;

export default function UploadHeroVideosModal({
  open = true,
  onClose,
  videos,
  onUpdated,
  embedded = false,
}: {
  open?: boolean;
  onClose?: () => void;
  videos: HeroVideo[];
  onUpdated: (videos: HeroVideo[]) => void;
  embedded?: boolean;
}) {
  const { role } = useAuth();
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [deletingKey, setDeletingKey] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      setFiles([]);
      setError("");
    }
  }, [open]);

  const previewUrls = useMemo(
    () => files.map((file) => ({ file, url: URL.createObjectURL(file) })),
    [files],
  );

  useEffect(() => {
    return () => {
      previewUrls.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [previewUrls]);

  const remainingSlots = Math.max(0, MAX_VIDEOS - videos.length);

  const selectFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files ?? []);
    if (selected.length === 0) {
      setFiles([]);
      return;
    }
    if (selected.length > remainingSlots) {
      setError(`You can add only ${remainingSlots} more hero video${remainingSlots === 1 ? "" : "s"}.`);
      setFiles([]);
      return;
    }
    for (const file of selected) {
      if (!file.type.startsWith("video/")) {
        setError("Please choose only video files.");
        setFiles([]);
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setError("Each video must be smaller than 30 MB.");
        setFiles([]);
        return;
      }
    }
    setFiles(selected);
    setError("");
  };

  const adminToken = async () => {
    const user = auth.currentUser;
    if (!user) throw new Error("Please sign in again.");
    return user.getIdToken();
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (role !== "admin" && role !== "super_admin") {
      setError("Only verified admins can manage hero videos.");
      return;
    }
    if (files.length === 0) {
      setError("Choose at least one hero video.");
      return;
    }

    setUploading(true);
    setError("");
    try {
      const token = await adminToken();
      const formData = new FormData();
      files.forEach((file) => formData.append("videos", file));

      const response = await fetch("/api/hero-videos", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const payload = (await response.json()) as {
        ok: boolean;
        error?: string;
        videos?: HeroVideo[];
      };
      if (!response.ok || !payload.ok || !payload.videos) {
        throw new Error(payload.error || "Could not upload hero videos.");
      }
      onUpdated(payload.videos);
      setFiles([]);
      onClose?.();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not upload hero videos.");
    } finally {
      setUploading(false);
    }
  };

  const removeVideo = async (key: string) => {
    setDeletingKey(key);
    setError("");
    try {
      const token = await adminToken();
      const response = await fetch(`/api/hero-videos?key=${encodeURIComponent(key)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = (await response.json()) as {
        ok: boolean;
        error?: string;
        videos?: HeroVideo[];
      };
      if (!response.ok || !payload.ok || !payload.videos) {
        throw new Error(payload.error || "Could not delete the hero video.");
      }
      onUpdated(payload.videos);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not delete the hero video.");
    } finally {
      setDeletingKey("");
    }
  };

  const form = (
      <form onSubmit={submit} className="space-y-4">
        <fieldset disabled={uploading || deletingKey !== ""} className="space-y-4 disabled:opacity-60">
          <div className="rounded-xl border border-saffron-200 bg-white p-3 text-sm text-slate-700">
            <p className="font-semibold text-slate-900">Hero banner playlist</p>
            <p className="mt-1 text-xs leading-5 text-slate-600">
              Upload up to {MAX_VIDEOS} videos. The home banner plays them in order and moves to the
              next one automatically when a video finishes.
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-900">
              Current videos ({videos.length}/{MAX_VIDEOS})
            </p>
            {videos.length === 0 ? (
              <p className="rounded-xl border border-dashed border-saffron-200 bg-white px-3 py-4 text-sm text-slate-500">
                No hero videos uploaded yet.
              </p>
            ) : (
              <div className={embedded ? "grid gap-3 sm:grid-cols-2 lg:grid-cols-3" : "space-y-3"}>
                {videos.map((video) => (
                  <div
                    key={video.key}
                    className="rounded-xl border border-saffron-200 bg-white p-3 shadow-sm"
                  >
                    <video
                      src={video.url}
                      muted
                      playsInline
                      controls
                      className="aspect-video w-full rounded-lg bg-slate-950 object-cover"
                    />
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">{video.name}</p>
                        <p className="text-xs text-slate-500">
                          {(video.size / (1024 * 1024)).toFixed(1)} MB
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => void removeVideo(video.key)}
                        disabled={deletingKey === video.key}
                        className="shrink-0"
                      >
                        {deletingKey === video.key ? "Removing..." : "Remove"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <label className="block rounded-xl border border-dashed border-saffron-200 bg-white p-3 text-sm font-semibold text-slate-700">
            Add videos ({remainingSlots} slot{remainingSlots === 1 ? "" : "s"} left)
            <input
              type="file"
              accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
              multiple
              onChange={selectFiles}
              className="mt-2 block w-full text-xs"
            />
          </label>

          {files.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-900">Upload preview</p>
              <div className="space-y-3">
                {previewUrls.map(({ file, url }) => (
                  <div key={`${file.name}-${file.size}`} className="rounded-xl border border-saffron-200 bg-white p-3">
                    <video
                      src={url}
                      muted
                      playsInline
                      controls
                      className="aspect-video w-full rounded-lg bg-slate-950 object-cover"
                    />
                    <p className="mt-2 truncate text-sm font-semibold text-slate-900">{file.name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </fieldset>

        {error && (
          <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
            {error}
          </p>
        )}

        <Button disabled={uploading || files.length === 0} type="submit" className="w-full sm:w-auto">
          {uploading ? "Uploading videos..." : "Upload selected videos"}
        </Button>
      </form>
  );

  if (embedded) return form;
  return (
    <Modal open={open} onClose={onClose ?? (() => undefined)} title="Manage hero videos">
      {form}
    </Modal>
  );
}
