"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus } from "lucide-react";
import { uploadToCloudinary } from "@/lib/cloudinaryUpload";

export function ImageUploadSlot({ value, onChange }: { value: string | null; onChange: (url: string) => void }) {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File | undefined) {
    if (!file || !file.type.startsWith("image/")) {
      setError("Solo se aceptan imágenes.");
      return;
    }
    setUploading(true);
    setError("");
    try {
      const url = await uploadToCloudinary(file);
      onChange(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al subir la imagen");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files?.[0]); }}
        className={`relative flex min-h-[130px] cursor-pointer items-center justify-center overflow-hidden rounded-md border-[1.5px] border-dashed transition ${
          dragOver ? "border-deep bg-accent-soft" : "border-border-strong bg-bg-soft hover:border-deep hover:bg-accent-soft"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        {value ? (
          <Image src={value} alt="" width={400} height={170} className="h-[170px] w-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-1.5 p-6 text-center text-muted-light">
            <ImagePlus size={30} className="text-deep" />
            <p className="text-[0.8rem]">{uploading ? "Subiendo..." : "Arrastra una foto aquí o haz clic para elegirla"}</p>
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-[0.72rem] text-danger">{error}</p>}
    </div>
  );
}
