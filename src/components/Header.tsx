import { useEffect, useRef, useState } from "react";
import { Menu, MessageCircle, Phone, X } from "lucide-react";
import { clinic, navLinks } from "../data/clinic";
import { handleWhatsAppClick, whatsAppDoctorLabel } from "../lib/gtag";

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [whatsappOpen, setWhatsappOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 32);
      setOpen(false);
      setWhatsappOpen(false);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open && !whatsappOpen) return;

    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!headerRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setWhatsappOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        setWhatsappOpen(false);
      }
    };

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open, whatsappOpen]);

  return (
    <header
      ref={headerRef}
      className="header-shell fixed inset-x-0 top-0 z-50 px-4 pt-4 md:px-6 md:pt-5"
    >
      <div
        className={`header-bar nv-glass mx-auto max-w-6xl ${scrolled ? "header-bar--scrolled" : ""}`}
      >
        <div className="header-layout grid md:items-stretch">
          <a
            href="#inicio"
            className="header-logo-panel group flex items-center justify-center border-r border-ink/8"
            aria-label={`${clinic.nombre} — Inicio`}
          >
            <img
              src={clinic.logo}
              alt=""
              aria-hidden
              className="header-logo-image shrink-0 object-contain group-hover:scale-[1.05]"
            />
            <span className="header-brand-name font-display font-bold leading-none tracking-tight text-ink">
              Novavision
            </span>
          </a>

          {/* Panel navegación */}
          <div className="header-navigation flex items-center justify-between md:justify-end">
            <nav
              className="hidden items-center gap-1 lg:flex"
              aria-label="Principal"
            >
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="header-nav-link relative px-3 py-2 font-display text-sm font-medium text-ink-soft transition-colors hover:text-ink"
                >
                  {link.label}
                </a>
              ))}
            </nav>

            <div className="hidden items-center gap-2 md:flex">
              <a
                href={`tel:${clinic.telefono}`}
                className="header-icon-btn grid"
                aria-label="Llamar"
              >
                <Phone size={17} strokeWidth={1.75} />
              </a>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setWhatsappOpen((current) => !current)}
                  aria-expanded={whatsappOpen}
                  className="nv-action header-cta inline-flex items-center gap-2 px-4 py-2.5 font-display text-sm font-semibold"
                >
                  <MessageCircle size={16} />
                  <span className="header-cta-label hidden sm:inline">Agendar cita</span>
                  <span className="sm:hidden">Cita</span>
                </button>
                {whatsappOpen && (
                  <div className="absolute right-0 top-full z-[80] mt-2 w-64 rounded-md border border-ink/10 bg-white p-2 shadow-glass-hover">
                    <p className="px-3 pb-2 pt-1 font-mono text-[0.6rem] uppercase tracking-wider text-muted">
                      Elige un especialista
                    </p>
                    {clinic.oftalmologos.map((doctor, index) => (
                      <a
                        key={doctor.nombre}
                        href={`https://wa.me/${doctor.whatsapp}?text=${encodeURIComponent(
                          `Hola, quisiera agendar una cita con ${doctor.nombre}`,
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => {
                          handleWhatsAppClick(whatsAppDoctorLabel(doctor.nombre));
                          setWhatsappOpen(false);
                        }}
                        className="flex items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors hover:bg-paper"
                      >
                        <span
                          className={`h-2.5 w-2.5 rounded-full ${
                            index === 0 ? "bg-orange" : "bg-teal"
                          }`}
                        />
                        <span className="font-display text-sm font-semibold text-ink">
                          {doctor.nombre}
                        </span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
              className="header-icon-btn grid ml-auto md:ml-0 lg:hidden"
              aria-label={open ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={open}
              onClick={() => {
                setOpen((v) => !v);
                setWhatsappOpen(false);
              }}
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Menú móvil / tablet */}
      <div
        className={`header-mobile mx-auto mt-2 max-w-6xl overflow-hidden lg:hidden ${
          open ? "header-mobile--open" : ""
        }`}
        aria-hidden={!open}
      >
        <nav
          className="border border-ink/8 bg-white p-4"
          aria-label="Menú móvil"
        >
          <ul className="grid gap-1 sm:grid-cols-2">
            {navLinks.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="block rounded-md border border-transparent px-4 py-3 font-display text-sm font-medium text-ink transition-colors hover:border-blue/20 hover:bg-paper hover:text-blue-deep"
                  onClick={() => {
                    setOpen(false);
                    setWhatsappOpen(false);
                  }}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <a
              href={`tel:${clinic.telefono}`}
              className="flex items-center justify-center gap-2 border border-ink/10 px-4 py-3 font-display text-sm font-semibold text-ink hover:border-blue/30 hover:text-blue-deep"
              onClick={() => setOpen(false)}
            >
              <Phone size={16} />
              Llamar
            </a>
            <button
              type="button"
              className="nv-action flex items-center justify-center gap-2 px-4 py-3 font-display text-sm font-semibold"
              onClick={() => setWhatsappOpen((current) => !current)}
              aria-expanded={whatsappOpen}
            >
              <MessageCircle size={16} />
              WhatsApp
            </button>
            {whatsappOpen && (
              <div className="grid gap-2 sm:col-span-2 sm:grid-cols-2">
                {clinic.oftalmologos.map((doctor, index) => (
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
                      setWhatsappOpen(false);
                    }}
                    className={`flex items-center justify-center gap-2 border px-4 py-3 font-display text-sm font-semibold ${
                      index === 0
                        ? "border-orange/30 bg-orange/8 text-ink"
                        : "border-teal/30 bg-teal/8 text-ink"
                    }`}
                  >
                    <MessageCircle
                      size={16}
                      className={index === 0 ? "text-orange" : "text-teal"}
                    />
                    {doctor.nombre}
                  </a>
                ))}
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
