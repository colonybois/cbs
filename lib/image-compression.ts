export async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) throw new Error("Please select an image file.");
  const image = new Image();
  const source = URL.createObjectURL(file);
  try {
    await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error("Unable to read image.")); image.src = source; });
    const maxDimension = 1600;
    const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(image.width * scale); canvas.height = Math.round(image.height * scale);
    canvas.getContext("2d")?.drawImage(image, 0, 0, canvas.width, canvas.height);
    let quality = 0.82;
    let blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/webp", quality));
    while (blob && blob.size > 200 * 1024 && quality > 0.3) { quality -= 0.1; blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/webp", quality)); }
    if (!blob) throw new Error("Unable to compress image.");
    return new File([blob], `${file.name.replace(/\.[^.]+$/, "")}.webp`, { type: "image/webp" });
  } finally { URL.revokeObjectURL(source); }
}
