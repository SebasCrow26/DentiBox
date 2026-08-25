export async function uploadToCloudinary(file: File): Promise<string> {
  const sigRes = await fetch("/api/admin/cloudinary-signature");
  const sigData = await sigRes.json();
  if (!sigRes.ok) throw new Error(sigData.error || "No se pudo firmar la subida");

  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", sigData.apiKey);
  formData.append("timestamp", sigData.timestamp);
  formData.append("signature", sigData.signature);
  formData.append("folder", sigData.folder);

  const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${sigData.cloudName}/image/upload`, {
    method: "POST",
    body: formData,
  });
  const uploadData = await uploadRes.json();
  if (!uploadRes.ok) throw new Error(uploadData.error?.message || "Falló la subida a Cloudinary");
  return uploadData.secure_url as string;
}
