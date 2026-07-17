import * as Accordion from "@radix-ui/react-accordion";
import { ChevronDown, MessageCircle } from "lucide-react";
import { faqs, whatsappUrl } from "../data/clinic";
import { Reveal, SectionLabel, SectionTitle } from "./ui/Reveal";

export function FAQ() {
  return (
    <section id="faq" className="border-t border-ink/8 bg-white py-16 md:py-28">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <div className="grid gap-9 md:gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <Reveal>
            <SectionLabel>Preguntas frecuentes</SectionLabel>
            <SectionTitle>Lo que más nos preguntan</SectionTitle>
            <p className="mt-5 text-lg text-ink-soft">
              Información útil antes de tu visita. Si tienes otra duda, escríbenos
              directamente.
            </p>

            <div className="mt-7 border border-ink/10 bg-paper p-5 md:mt-8 md:p-8">
              <p className="font-display text-lg font-bold text-ink">
                ¿Lista tu consulta?
              </p>
              <p className="mt-2 text-sm text-ink-soft">
                Agenda en minutos por WhatsApp.
              </p>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-2 rounded-md bg-orange px-5 py-2.5 font-display text-sm font-semibold text-white hover:bg-orange-dark"
              >
                <MessageCircle size={16} />
                Escribir ahora
              </a>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <Accordion.Root type="single" collapsible className="space-y-2">
              {faqs.map((item, i) => (
                <Accordion.Item
                  key={item.pregunta}
                  value={`item-${i}`}
                  className="border border-ink/8 bg-paper data-[state=open]:border-blue/30 data-[state=open]:shadow-[0_4px_20px_rgba(28,45,55,0.05)]"
                >
                  <Accordion.Header>
                    <Accordion.Trigger className="group flex w-full items-center justify-between gap-3 px-4 py-4 text-left font-display text-[0.95rem] font-semibold leading-snug text-ink transition-colors hover:text-blue md:gap-4 md:px-6 md:py-5 md:text-base">
                      {item.pregunta}
                      <ChevronDown
                        size={18}
                        className="shrink-0 text-teal transition-transform duration-300 group-data-[state=open]:rotate-180"
                      />
                    </Accordion.Trigger>
                  </Accordion.Header>
                  <Accordion.Content className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                    <p className="mx-4 mb-0 border-l-[3px] border-orange py-4 pl-4 text-[0.95rem] text-ink-soft md:mx-6 md:py-5 md:pl-5">
                      {item.respuesta}
                    </p>
                  </Accordion.Content>
                </Accordion.Item>
              ))}
            </Accordion.Root>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
