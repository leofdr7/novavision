import { Shield, Stethoscope, Timer, Users } from "lucide-react";

const items = [
  { icon: Stethoscope, text: "Diagnóstico especializado" },
  { icon: Users, text: "Trato para todas las edades" },
  { icon: Timer, text: "Citas puntuales" },
  { icon: Shield, text: "Atención personalizada" },
];

export function TrustBar() {
  return (
    <div className="border-y border-ink/8 bg-white py-5">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-10 gap-y-4 px-5 md:px-8">
        {items.map(({ icon: Icon, text }) => (
          <div key={text} className="flex items-center gap-2.5 text-sm text-ink-soft">
            <Icon size={18} className="text-blue" strokeWidth={1.5} />
            <span>{text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
