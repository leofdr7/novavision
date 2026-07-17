import { clinic, navLinks, whatsappUrl } from "../data/clinic";

export function Footer() {
  return (
    <footer className="border-t border-ink/10 bg-paper-dark py-14">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <a href="#inicio" className="font-display text-xl font-bold text-ink">
              {clinic.nombre}
            </a>
            <p className="mt-3 max-w-xs text-sm text-ink-soft">
              Dr. Andy Alvarenga y Dra. Karla Vides — oftalmología en Colonia Médica,
              San Salvador.
            </p>
            <div className="mt-5 flex gap-3">
              {[
                { href: clinic.redes.facebook, label: "Facebook", letter: "f" },
                { href: clinic.redes.instagram, label: "Instagram", letter: "ig" },
                { href: whatsappUrl, label: "WhatsApp", letter: "wa" },
              ].map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="flex h-10 w-10 items-center justify-center border border-ink/10 bg-white font-mono text-xs font-medium text-ink transition-colors hover:border-blue hover:text-blue"
                >
                  {s.letter}
                </a>
              ))}
            </div>
          </div>

          <div>
            <p className="font-mono text-[0.65rem] uppercase tracking-wider text-muted">
              Navegación
            </p>
            <ul className="mt-4 space-y-2">
              {navLinks.map((l) => (
                <li key={l.href}>
                  <a href={l.href} className="text-sm text-ink-soft hover:text-blue">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="font-mono text-[0.65rem] uppercase tracking-wider text-muted">
              Contacto
            </p>
            <ul className="mt-4 space-y-2 text-sm text-ink-soft">
              <li>
                <a href="tel:21243333" className="hover:text-blue">
                  {clinic.telefono}
                </a>
              </li>
              <li>
                <a href="tel:22352464" className="hover:text-blue">
                  {clinic.telefonoAlterno}
                </a>
              </li>
              <li>
                <a href={whatsappUrl} className="hover:text-blue">
                  WhatsApp: 7068-1751
                </a>
              </li>
              <li>Colonia Médica, Local 81</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-wrap justify-between gap-3 border-t border-ink/10 pt-6 text-xs text-muted">
          <span>&copy; 2026 {clinic.nombre}. Todos los derechos reservados.</span>
          <span>Información orientativa. Consulte siempre a su médico.</span>
        </div>
      </div>
    </footer>
  );
}
