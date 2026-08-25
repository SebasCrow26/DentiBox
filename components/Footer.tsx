import Image from "next/image";
import Link from "next/link";

const LOGO_URL =
  "https://res.cloudinary.com/b8s550ww/image/upload/w_320,q_auto,f_auto/v1783701652/Dentibox_n4ifvv.png";

const SOCIALS = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/ddentibox?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==",
    icon: "https://res.cloudinary.com/b8s550ww/image/upload/v1783706975/Instagram_thjb3e.png",
  },
  {
    label: "Facebook",
    href: "https://www.facebook.com/dentibox.deposito.5/about?locale=es_LA",
    icon: "https://res.cloudinary.com/b8s550ww/image/upload/v1783706972/facebook_vztkr4.png",
  },
  {
    label: "WhatsApp",
    href: "https://wa.me/573107992293",
    icon: "https://res.cloudinary.com/b8s550ww/image/upload/v1783707549/copy_of_whatsapp_bhgvp2.png",
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-5 px-[5%] py-10">
        <Image src={LOGO_URL} alt="DentiBox" width={320} height={200} className="h-9 w-auto opacity-90" />
        <p className="text-[13px] text-muted-light">© 2026 DentiBox. Todos los derechos reservados.</p>
        <div className="flex gap-4">
          <Link href="/" className="text-[13px] text-muted hover:text-deep">
            Catálogo
          </Link>
          <Link href="/contacto" className="text-[13px] text-muted hover:text-deep">
            Contacto
          </Link>
        </div>
        <div className="flex gap-3">
          {SOCIALS.map((s) => (
            <a
              key={s.label}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={s.label}
              className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted transition hover:border-deep hover:text-deep"
            >
              <Image src={s.icon} alt="" width={16} height={16} />
              {s.label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
