import Image from "next/image";
import { WHATSAPP_NUMBER } from "@/lib/whatsapp";

export function WhatsAppButton() {
  return (
    <a
      href={`https://wa.me/${WHATSAPP_NUMBER}`}
      target="_blank"
      rel="noreferrer"
      aria-label="Escribir por WhatsApp"
      className="fixed bottom-[22px] right-[22px] z-[900] flex h-[54px] w-[54px] items-center justify-center rounded-full bg-whatsapp shadow-md transition-transform hover:scale-105"
    >
      <Image
        src="https://res.cloudinary.com/b8s550ww/image/upload/v1783707549/copy_of_whatsapp_bhgvp2.png"
        alt="WhatsApp"
        width={27}
        height={27}
      />
    </a>
  );
}
