import { MessageCircle, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { clinic } from "../data/clinic";

export function WhatsAppButton() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  return (
    <div ref={containerRef} className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {open && (
        <div className="mb-3 w-[min(18rem,calc(100vw-3rem))] overflow-hidden rounded-lg border border-ink/10 bg-white shadow-[0_16px_45px_rgba(28,45,55,0.18)]">
          <div className="border-b border-ink/8 bg-paper px-4 py-3">
            <p className="font-display text-sm font-bold text-ink">
              ¿Con quién deseas agendar?
            </p>
            <p className="mt-0.5 text-xs text-muted">Elige un especialista para continuar.</p>
          </div>
          <div className="grid gap-1 p-2">
            {clinic.oftalmologos.map((doctor, index) => (
              <a
                key={doctor.nombre}
                href={`https://wa.me/${doctor.whatsapp}?text=${encodeURIComponent(
                  `Hola, quisiera agendar una cita con ${doctor.nombre}`,
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="group flex items-center gap-3 rounded-md px-3 py-2.5 transition-colors hover:bg-paper"
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white ${
                    index === 0 ? "bg-orange" : "bg-teal"
                  }`}
                >
                  <MessageCircle size={17} />
                </span>
                <span>
                  <span className="block font-display text-sm font-bold text-ink">
                    {doctor.nombre}
                  </span>
                  <span className="block text-xs text-muted">{doctor.especialidad}</span>
                </span>
              </a>
            ))}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label={open ? "Cerrar opciones de WhatsApp" : "Agendar cita por WhatsApp"}
        aria-expanded={open}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_8px_24px_rgba(37,211,102,0.35)] transition-transform hover:scale-105"
      >
        {open ? <X size={25} /> : <MessageCircle size={26} />}
      </button>
    </div>
  );
}
