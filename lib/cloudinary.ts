async function sha1Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-1", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Firma una subida de Cloudinary con Web Crypto (compatible con edge runtime, sin el SDK de Node). */
export async function signCloudinaryUpload(params: Record<string, string>, apiSecret: string): Promise<string> {
  const toSign = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return sha1Hex(toSign + apiSecret);
}
