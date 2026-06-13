// Client-side helper to check if a file is a HEIC/HEIF image
export function isHeicImage(file: File): boolean {
  const name = file.name.toLowerCase();
  return (
    file.type === "image/heic" ||
    file.type === "image/heif" ||
    name.endsWith(".heic") ||
    name.endsWith(".heif")
  );
}

// Generates a preview URL, converting HEIC/HEIF files server-side if needed
export async function getPreviewUrl(file: File): Promise<string> {
  if (isHeicImage(file)) {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload/preview", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Preview conversion failed");
      }

      const data = (await response.json()) as { dataUrl: string };
      return data.dataUrl;
    } catch (error) {
      console.error("Failed to generate preview for HEIC image:", error);
      return URL.createObjectURL(file);
    }
  }

  return URL.createObjectURL(file);
}
