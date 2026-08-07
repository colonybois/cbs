import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "@/lib/firebase";
import { compressImage } from "@/lib/image-compression";

export type StorageFolder = "site-assets" | "events" | "flashback" | "payment-proofs";

// Firestore documents have a 1 MiB limit. A data URL is larger than the source
// image because it is base64 encoded, so keep the fallback comfortably below it.
const MAX_INLINE_IMAGE_BYTES = 700 * 1024;

function toDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Unable to prepare the image for upload."));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}

function canUseInlineFallback(error: unknown) {
  const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
  return [
    "storage/object-not-found",
    "storage/bucket-not-found",
    "storage/unknown",
    "storage/retry-limit-exceeded",
    "storage/unauthorized",
  ].includes(code);
}

export async function uploadImageToStorage(file: File, folder: StorageFolder): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Only image files can be uploaded.");
  const optimizedFile = await compressImage(file);
  const filename = `${Date.now()}_${optimizedFile.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const fileRef = ref(storage, `${folder}/${filename}`);
  try {
    const snapshot = await uploadBytes(fileRef, optimizedFile, { contentType: optimizedFile.type });
    return getDownloadURL(snapshot.ref);
  } catch (error) {
    if (!canUseInlineFallback(error)) throw error;
    if (optimizedFile.size > MAX_INLINE_IMAGE_BYTES) {
      throw new Error("The image could not be reduced enough to save. Please choose a smaller image.");
    }
    return toDataUrl(optimizedFile);
  }
}

export const uploadImage = uploadImageToStorage;
