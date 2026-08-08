import { compressImage } from "@/lib/image-compression";

export type StorageFolder = "site-assets" | "events" | "flashback" | "payment-proofs";

// Firestore documents have a 1 MiB limit. A base64 data URL is ~33% larger
// than the raw bytes, so keep compressed output well below 700 KB.
const MAX_INLINE_BYTES = 700 * 1024;

function toDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Unable to read the image file."));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}

/**
 * Compresses the image and returns a base64 data URL stored directly in
 * Firestore — no Firebase Storage bucket required, no CORS config needed.
 */
export async function uploadImageToStorage(file: File, _folder: StorageFolder): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Only image files can be uploaded.");
  const optimized = await compressImage(file);
  if (optimized.size > MAX_INLINE_BYTES) {
    throw new Error(
      `The image is still too large after compression (${Math.round(optimized.size / 1024)} KB). Please choose a smaller image.`
    );
  }
  return toDataUrl(optimized);
}

export const uploadImage = uploadImageToStorage;
