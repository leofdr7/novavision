import { MessageCircle, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { clinic } from "../data/clinic";
import { handleWhatsAppClick, whatsAppDoctorLabel } from "../lib/gtag";

export function WhatsAppButton({ open, onOpenChange: setOpen }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setOpen(false); triggerRef.current?.focus({ preventScroll: true }); }
    };

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open, setOpen]);

  return (
    <div ref={containerRef} className="relative flex flex-col items-end">
      {open && (
        <div id="novavision-whatsapp" role="region" aria-label="Especialistas disponibles por WhatsApp" className="nv-glass nv-whatsapp-options absolute right-0 bottom-[calc(100%+.75rem)] max-h-[calc(100dvh-7rem-env(safe-area-inset-bottom))] w-[min(18rem,calc(100vw-3rem))] overflow-y-auto">
          <div className="border-b border-ink/8 px-4 py-3">
            <p className="font-display text-sm font-bold text-ink">
              ¿Con quién deseas agendar?
            </p>
            <p className="mt-0.5 text-xs text-muted">Elige un especialista para continuar.</p>
          </div>
          <div className="grid gap-2 p-2">
            {clinic.oftalmologos.map((doctor) => (
              <a
                key={doctor.nombre}
                href={`https://wa.me/${doctor.whatsapp}?text=${encodeURIComponent(
                  `Hola, quisiera agendar una cita con ${doctor.nombre}`,
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  handleWhatsAppClick(whatsAppDoctorLabel(doctor.nombre));
                  setOpen(false);
                }}
                className="header-mobile-control menu-item-doctor flex items-center gap-3 px-3 py-2.5"
              >
                <span
                  className="header-mobile-control menu-item-doctor flex h-11 w-11 shrink-0 items-center justify-center"
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
        ref={triggerRef}
        type="button"
        aria-controls="novavision-whatsapp"
        onClick={() => setOpen(!open)}
        aria-label={open ? "Cerrar opciones de WhatsApp" : "Agendar cita por WhatsApp"}
        aria-expanded={open}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_8px_24px_rgba(37,211,102,0.35)] transition-transform hover:scale-105"
      >
        {open ? <X size={25} /> : <MessageCircle size={26} />}
      </button>
    </div>
  );
}
