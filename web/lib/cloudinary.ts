export async function uploadImage(file: File): Promise<string> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName) {
    throw new Error("Cloudinary is not configured (NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME)");
  }
  if (!uploadPreset) {
    throw new Error(
      "Cloudinary unsigned upload preset is not set (NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET). " +
        "Create an unsigned upload preset in the Cloudinary dashboard and add it to web/.env.local.",
    );
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: "POST", body: formData }
  );

  if (!res.ok) {
    throw new Error("Upload failed");
  }

  const data = await res.json();
  return data.secure_url as string;
}
