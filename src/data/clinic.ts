export type Doctor = {
  nombre: string;
  especialidad: string;
  descripcion: string;
  servicios: string[];
  serviciosGrupos?: { titulo: string; items: string[] }[];
  telefonos: string[];
  whatsapp?: string;
  ubicaciones?: string[];
  redes?: {
    instagram?: string;
    facebook?: string;
    tiktok?: string;
    web?: string;
  };
};

export const clinic = {
  nombre: "Novavision",
  logo: "/logo.png",
  direccion:
    "Prolongación Boulevard Tutunichapa y 1.ª Diagonal Dr. Arturo Romero, Edificio Condominio Médico #328, piso 8, local 81, Colonia Médica, San Salvador",
  direccionSecundaria:
    "Prolongación Boulevard Tutunichapa y 1a Diagonal, Condominio Médico, Local 22, Colonia Médica, San Salvador",
  telefono: "2124-3333",
  whatsapp: "50370681751",
  horarios:
    "Lunes a viernes de 8:00 AM a 6:00 PM\nSábado de 8:00 AM a 2:00 PM",
  ubicacionWaze:
    "Edificio Condominio Médico #328, 1a Diagonal Dr. Arturo Romero, San Salvador, El Salvador",
  experiencia:	
    "Dos oftalmólogos con consultorio en Colonia Médica, San Salvador. Atención en evaluación visual, diagnóstico de catarata, enfermedades de retina y nervio óptico, cirugía refractiva, segmento anterior y procedimientos láser.",
  serviciosIntro:
    "Evaluación visual, diagnóstico especializado y cirugías oftalmológicas con enfoque en catarata, retina, córnea y segmento anterior.",
  redes: {
    facebook: "https://www.facebook.com/",
    instagram: "https://www.instagram.com/drakarlavides",
  },
  oftalmologos: [
    {
      nombre: "Dr. Andy Alvarenga",
      especialidad: "Oftalmólogo",
      descripcion:
        "Oftalmólogo con consultorio en Colonia Médica, San Salvador. Especializado en cirugías de retina, catarata y procedimientos oftalmológicos, además de graduación de lentes monofocales y progresivos.",
      servicios: [
        "Cirugía para desprendimiento de retina",
        "Cirugía láser para retinopatía diabética",
        "Cirugía de mácula",
        "Cirugía de catarata por facoemulsificación sin puntos",
        "Cirugía de pterigión (carnosidad)",
        "Cirugía de chalazión",
        "Graduación de lentes monofocales y progresivos",
      ],
      serviciosGrupos: [
        {
          titulo: "Cirugía",
          items: [
            "Cirugía para desprendimiento de retina",
            "Cirugía láser para retinopatía diabética",
            "Cirugía de mácula",
            "Cirugía de catarata por facoemulsificación sin puntos",
            "Cirugía de pterigión (carnosidad)",
            "Cirugía de chalazión",
          ],
        },
        {
          titulo: "Óptica",
          items: [
            "Graduación de lentes monofocales y progresivos, con amplia variedad de aros",
          ],
        },
      ],
      telefonos: ["2124-3333"],
      whatsapp: "50370681751",
      ubicaciones: [
        "Edificio Condominio Médico, Local 81, Colonia Médica"
      ],
    },
    {
      nombre: "Dra. Karla Vides",
      especialidad: "Oftalmóloga · Segmento anterior",
      descripcion:
        "Oftalmóloga especialista en segmento anterior, con experiencia en cirugía de catarata, cirugía refractiva, tratamiento de queratocono y enfermedades de la córnea y superficie ocular. Promueve el chequeo visual anual como prevención.",
      servicios: [
        "Cirugía de catarata",
        "Cirugía refractiva con láser",
        "Crosslinking para queratocono",
        "Cirugía para miopes altos con lentes fáquicos",
        "Cirugía de pterigión con autoinjerto",
        "Cirugía facorrefractiva",
        "Láser para glaucoma y lente intraocular",
        "Chequeo visual anual",
      ],
      telefonos: ["2124-3333", "7989-3654"],
      whatsapp: "50379893654",
      ubicaciones: ["Edificio Condominio Médico, Local 81, Colonia Médica"],
      redes: {
        instagram: "https://www.instagram.com/drakarlavides",
        tiktok: "https://www.tiktok.com/@dra.karla.vides",
        web: "https://medicosdeelsalvador.com",
      },
    },
  ] satisfies Doctor[],
};

export const servicios = [
  {
    titulo: "Evaluación visual",
    descripcion:
      "Detección de cambios en la graduación y diferencias entre ambos ojos.",
    icon: "glasses" as const,
  },
  {
    titulo: "Cirugía de catarata",
    descripcion: "Diagnóstico y manejo quirúrgico con técnicas actuales.",
    icon: "droplet" as const,
  },
  {
    titulo: "Retina y nervio óptico",
    descripcion: "Estudio de enfermedades de retina y alteraciones del nervio óptico.",
    icon: "activity" as const,
  },
  {
    titulo: "Cirugía refractiva",
    descripcion: "Corrección con láser para reducir o eliminar el uso de lentes.",
    icon: "zap" as const,
  },
  {
    titulo: "Córnea y superficie ocular",
    descripcion: "Queratocono, pterigión, chalazión y enfermedades del segmento anterior.",
    icon: "circle" as const,
  },
  {
    titulo: "Chequeo visual anual",
    descripcion: "Control preventivo para cuidar tu salud visual a largo plazo.",
    icon: "baby" as const,
  },
];

export const faqs = [
  {
    pregunta: "¿Necesito referencia médica para una consulta?",
    respuesta:
      "No es necesaria una referencia, puedes agendar tu cita directamente con nosotros.",
  },
  {
    pregunta: "¿Qué debo llevar a mi primera consulta?",
    respuesta:
      "Documento de identidad, lentes o graduación actual, estudios previos y lista de medicamentos si los usas.",
  },
  {
    pregunta: "¿Es normal que un ojo vea mejor que el otro?",
    respuesta:
      "Es común una pequeña diferencia de graduación entre ambos ojos. Si un ojo empieza a ver mucho peor de forma repentina, no debe ignorarse: puede deberse a cambios de graduación, cataratas, enfermedades de retina o alteraciones del nervio óptico.",
  },
  {
    pregunta: "¿Cómo puedo agendar una cita?",
    respuesta: `Llama al ${clinic.telefono}, o escribe por WhatsApp al 7068-1751 (Dr. Alvarenga) o 7989-3654 (Dra. Vides).`,
  },
  {
    pregunta: "¿Dónde están ubicados los consultorios?",
    respuesta: `Atendemos en Colonia Médica, San Salvador: ${clinic.direccion}. El Dr. Andy Alvarenga también atiende en ${clinic.direccionSecundaria}.`,
  },
];

export const navLinks = [
  { href: "#nosotros", label: "Nosotros" },
  { href: "#servicios", label: "Servicios" },
  { href: "#faq", label: "Preguntas" },
  { href: "#contacto", label: "Contacto" },
];

export const whatsappUrl = `https://wa.me/${clinic.whatsapp}?text=${encodeURIComponent("Hola, quisiera agendar una cita")}`;

export const wazeUrl = `https://waze.com/ul?q=${encodeURIComponent(clinic.ubicacionWaze)}&navigate=yes`;
