import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "@/lib/firebase";

export type StorageFolder = "site-assets" | "events" | "flashback";

export async function uploadImageToStorage(file: File, folder: StorageFolder): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Only image files can be uploaded.");
  const filename = `${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
  const fileRef = ref(storage, `${folder}/${filename}`);
  const snapshot = await uploadBytes(fileRef, file, { contentType: file.type });
  return getDownloadURL(snapshot.ref);
}

export const uploadImage = uploadImageToStorage;
