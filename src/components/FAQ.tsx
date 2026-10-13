import * as Accordion from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";
import { faqs } from "../data/clinic";
import { Reveal, SectionLabel, SectionTitle } from "./ui/Reveal";

export function FAQ() {
  return (
    <section id="faq" className="faq-section border-t border-ink/8 py-16 md:py-28">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <div className="grid gap-9 md:gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <Reveal>
            <SectionLabel>Preguntas frecuentes</SectionLabel>
            <SectionTitle>Lo que más nos preguntan</SectionTitle>
            <p className="mt-5 text-lg text-ink-soft">
              Información útil antes de tu visita. Si tienes otra duda, escríbenos
              directamente.
            </p>
          </Reveal>

          <Reveal delay={0.1}>
            <Accordion.Root type="single" collapsible className="space-y-3">
              {faqs.map((item, i) => (
                <Accordion.Item
                  key={item.pregunta}
                  value={`item-${i}`}
                  className="faq-card nv-glass"
                >
                  <Accordion.Header>
                    <Accordion.Trigger className="faq-trigger group flex w-full items-center justify-between gap-3 px-4 py-4 text-left font-display text-[0.95rem] font-semibold leading-snug text-ink transition-colors hover:text-blue-deep md:gap-4 md:px-6 md:py-5 md:text-base">
                      {item.pregunta}
                      <ChevronDown
                        size={18}
                        className="shrink-0 text-teal transition-transform duration-300 group-data-[state=open]:rotate-180"
                      />
                    </Accordion.Trigger>
                  </Accordion.Header>
                  <Accordion.Content className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                    <p className="mx-4 mb-0 border-l-[3px] border-teal/60 py-4 pl-4 text-[0.95rem] text-ink md:mx-6 md:py-5 md:pl-5">
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
