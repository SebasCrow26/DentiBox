import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { signCloudinaryUpload } from "@/lib/cloudinary";

export const runtime = "edge";

export async function GET() {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Supabase no configurado" }, { status: 500 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
  if (!profile?.is_admin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json({ error: "Cloudinary no configurado" }, { status: 500 });
  }

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const folder = "dentibox/productos";
  const signature = await signCloudinaryUpload({ folder, timestamp }, apiSecret);

  return NextResponse.json({ signature, timestamp, folder, apiKey, cloudName });
}
