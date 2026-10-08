# novavision

Landing page para consultorio oftalmológico — React + Vite + Tailwind + Framer Motion + Radix UI.

## Stack

- **React 19** + **TypeScript** + **Vite**
- **Tailwind CSS v4** — tokens de diseño personalizados
- **Framer Motion** — animaciones al scroll
- **Radix UI Accordion** — FAQ accesible
- **Lucide React** — iconografía

## Desarrollo

```bash
npm install
npm run dev
```

## Placeholders

Edita `src/data/clinic.ts` con los datos reales:

- `[NOMBRE_CLINICA]`, doctores, dirección, teléfono, WhatsApp, horarios, coordenadas Waze, redes sociales y textos de FAQ/experiencia.

## Build

```bash
npm run build
npm run preview
```

## Asistente informativo

El widget se abre desde «Consultar al asistente», se carga de forma diferida y conserva su historial solo en memoria. Al abrir WhatsApp se cierra el panel del chat y viceversa. El panel del chat no contiene enlaces de contacto. Ambos doctores siguen disponibles mediante el botón flotante verde de WhatsApp, incluso si la IA no está configurada o falla.

El panel usa Syne y Newsreader y la paleta existente. Las sugerencias iniciales envían preguntas predefinidas; desaparecen al enviar el primer mensaje. El campo crece hasta 136 px (Enter envía, Shift+Enter inserta un salto). Los puntos de espera, el cursor, las burbujas y la apertura/cierre se animan solo con CSS mediante `transform` y `opacity`, respetando `prefers-reduced-motion`. El CSS se carga junto con el panel. El seguimiento suave se pausa al subir a leer y se recupera al volver al final o enviar una pregunta; al cerrar, el panel queda inerte durante la salida y conserva el historial.

El backend Node de `api/chat.ts` usa Responses API de OpenAI con streaming, `store: false` y sin herramientas. No guarda conversaciones ni registra cuerpos de solicitudes, respuestas, IP en claro o errores del SDK. Las únicas salidas de log son códigos operativos y un aviso agregado de presupuesto.

### Configuración local

1. Ejecutar `npm ci`.
2. Copiar `.env.example` a `.env.local` y completar las variables de servidor. Nunca usar el prefijo `VITE_` para secretos.
3. Generar dos secretos independientes, por ejemplo con `openssl rand -hex 32`, para `CHAT_SESSION_SECRET` y `RATE_LIMIT_HASH_SECRET`.
4. Configurar una base Upstash Redis dedicada al proyecto. Solo recibe contadores, reservas e identificadores seudónimos con caducidad.
5. Ejecutar `npm run dev:full` (Node 20.12 o posterior; Vercel CLI mediante `npx`, que puede solicitar iniciar sesión y vincular el proyecto). El script carga `.env.local` en el proceso padre para que las funciones también reciban sus variables. Ajustar `ALLOWED_ORIGIN` al origen exacto mostrado, sin barra final.
6. Establecer `CHAT_ENABLED=true` únicamente al completar la configuración.

`npm run dev` sigue ejecutando solo Vite. `npm run preview` sirve el build estático y no ejecuta `/api/chat`; en ese modo se muestra la alternativa WhatsApp. Las pruebas de navegador simulan la API explícitamente.

Reiniciar `npm run dev:full` después de modificar `.env.local`. Las variables ya exportadas en la terminal tienen prioridad sobre el archivo. Invocar `vercel dev` directamente no garantiza cargar `.env.local` en las funciones Node: las versiones de CLI revisadas (59.25.2 y 63.1.0) leen `.env`/`.env.build` o las variables Development del proyecto; que Vite lea `.env.local` no las comparte con la función. La carga explícita del script es solo local; en los despliegues se utilizan las variables configuradas en Vercel.

Si `GET /api/chat` devuelve `available: false`, revisar el log del **servidor**, no la consola del navegador. El evento `chat_unavailable` identifica la condición con `code`:

| Código | Condición |
| --- | --- |
| `chat_disabled` | `CHAT_ENABLED` está desactivado explícitamente |
| `missing_config` | Falta la bandera o alguna variable requerida en el proceso de la función |
| `invalid_config` | La configuración no cumple el esquema o las tarifas son inconsistentes |
| `session_limit` | La sesión alcanzó su cuota de mensajes |
| `budget_exceeded` | El saldo mensual no alcanza para reservar la siguiente respuesta |

Los fallos de Redis (incluido el timeout del limitador) producen HTTP 503 y el evento `chat_request_failed` con `code: "redis_unavailable"`, en lugar de HTTP 200 con `available: false`. Un `PONG` no verifica la carga de configuración ni el saldo. Los logs de configuración incluyen únicamente nombres de campos en `fields`; nunca valores, secretos, IPs, sesiones ni mensajes. No se exponen los detalles de configuración en las respuestas públicas.

### Variables de entorno

| Variable | Uso / ejemplo |
| --- | --- |
| `CHAT_ENABLED` | `false` por defecto; `true` activa el servidor si la configuración está completa |
| `OPENAI_API_KEY` | Clave de un proyecto OpenAI dedicado |
| `OPENAI_MODEL` | `gpt-4.1-mini`; obligatorio, sin modelo predeterminado en el código |
| `OPENAI_TOKEN_ENCODING` | `o200k_base` para GPT-4.1 mini; debe corresponder al modelo |
| `OPENAI_INPUT_USD_PER_1M` | `0.40` |
| `OPENAI_CACHED_INPUT_USD_PER_1M` | `0.10` |
| `OPENAI_OUTPUT_USD_PER_1M` | `1.60` |
| `CHAT_MONTHLY_BUDGET_USD` | `10` |
| `ALLOWED_ORIGIN` | Lista separada por comas; producción: `https://www.novavision.com.sv,https://novavision.com.sv` |
| `UPSTASH_REDIS_REST_URL` | URL HTTPS del servicio |
| `UPSTASH_REDIS_REST_TOKEN` | Token privado del servicio |
| `CHAT_SESSION_SECRET` | Secreto de al menos 32 caracteres para cookies firmadas |
| `RATE_LIMIT_HASH_SECRET` | Otro secreto de al menos 32 caracteres para HMAC de IP |

Estas tarifas son ejemplos, no precios consultados automáticamente. Al cambiar el modelo hay que verificar compatibilidad con Responses, streaming y límite de salida, actualizar tarifas/tokenizer y repetir las evaluaciones. No configurar un tokenizer que no corresponda al modelo. Fuentes: [modelo](https://developers.openai.com/api/docs/models/gpt-4.1-mini), [streaming](https://developers.openai.com/api/docs/guides/streaming-responses).

### API y controles

- `GET /api/chat`: devuelve disponibilidad y límites. Inicializa una cookie `HttpOnly`, `SameSite=Strict`, `Secure` en Vercel, con firma y vigencia máxima de 24 horas; no contiene historial.
- `POST /api/chat`: JSON `{ requestId: UUID, contactMentioned: boolean, messages: [{ role: "user" | "assistant", content: string }] }`. Solo se aceptan mensajes alternados, empezando y terminando en `user`, con un máximo de 4 intercambios anteriores y la pregunta nueva.
- El servidor añade las instrucciones y los datos aprobados. No acepta modelo, roles privilegiados ni ajustes de consumo desde el cliente.
- Éxito: SSE con `meta`, `delta`, `done`. Antes del stream los errores son JSON `{ error: { code, message } }`; después se emite `error`. Un cierre sin `done` es incompleto y no se reutiliza como historial.
- Estados: 400 entrada inválida; 403 origen/sesión; 405 método; 409 repetición/concurrencia; 413 tamaño; 429 cuota; 502 proveedor/respuesta incompleta; 503 configuración, dependencia o presupuesto; 504 timeout.
- Todas las respuestas usan `no-store`. Orígenes ausentes o no autorizados se rechazan en POST. CORS no autentica clientes: los límites y el presupuesto siguen siendo necesarios.

Límites: 6 POST/minuto y 60/día por IP seudonimizada, 10 inicializaciones/minuto, 20 mensajes por sesión, una generación simultánea por sesión, 1.000 caracteres de usuario, 4.000 por respuesta histórica y 32 KiB por cuerpo. Entrada máxima de 6.000 tokens con margen de encuadre; se eliminan pares antiguos completos. Salida máxima de 400 tokens. Timeout de generación de 45 segundos y función de 60 segundos. Sin reintentos automáticos de OpenAI.

El tokenizer cuenta fragmentos pequeños para limitar el trabajo con entradas repetitivas y utiliza márgenes conservadores. `server/chat/knowledge.ts` contiene los tres textos aprobados por los doctores: urgencia, molestias no urgentes y pregunta general sobre señales de alarma. La detección textual responde sin llamar al modelo; ante síntomas ambiguos prioriza el caso urgente. Los casos urgente y general nunca incluyen WhatsApp, agendar ni el teléfono del consultorio: remiten exclusivamente a emergencias/911. El consultorio no atiende emergencias. No se repite el aviso de datos sensibles del pie del chat.

El caso no urgente usa el texto aprobado completo la primera vez. Si WhatsApp ya se mencionó, omite únicamente la frase de agendar, conservando literalmente el resto y la advertencia de emergencia; puede volver a incluirla si el usuario pide cómo agendar. `contactMentioned` conserva ese estado en memoria al recortar el historial, sin guardarlo en Redis. El prompt mantiene las mismas restricciones para entradas que el filtro no reconozca. La detección no es una evaluación clínica ni cubre todas las formas de describir síntomas.

Los servicios de `knowledge.ts` proceden de la sección de servicios y de las listas visibles en las tarjetas de cada doctor (`serviciosGrupos`, o `servicios` cuando no hay grupos), conservando nombre y especialidad. El resumen general usa cinco categorías: cirugía, córnea y refractiva, retina, óptica (graduación de lentes monofocales y progresivos) y chequeo anual, y ofrece detallar por doctor. `server/chat/services.ts` responde las consultas directas de catálogo sin generación; las demás formulaciones usan el prompt con los mismos límites de contenido. Un procedimiento, técnica o asociación con un doctor que no esté publicado se reconoce como información desconocida, sin afirmar que no se ofrece. Las respuestas médicas conservan prioridad. `tests/chat-services.test.ts` verifica las cuatro preguntas de servicios, la correspondencia con el sitio, datos desconocidos y la salida SSE del endpoint con admisión Redis simulada.

Las cuotas y bloqueos viven en Redis, nunca en memoria de una función. Se rechaza el resultado `reason: timeout` del limitador, aunque venga marcado como permitido. Un fallo de Redis deja solo WhatsApp. Las sesiones y recibos de admisión caducan en 24 horas; el bloqueo de generación en 60 segundos. Crear nuevas cookies no evita los límites por IP ni el presupuesto global. IPs compartidas pueden compartir cuota.

### Presupuesto y operación

El prefijo `novavision:chat:<VERCEL_ENV>` separa producción, preview y desarrollo. Todos los previews comparten deliberadamente un presupuesto para evitar multiplicarlo por despliegue. Cada mes tiene una clave independiente, con calendario de `America/El_Salvador` y retención de 60 días desde la última actualización; no necesita cron.

El campo `used` suma el gasto calculado con `usage` de OpenAI en nanodólares enteros:

```text
USD = ((input_tokens - cached_tokens) × precio_entrada
      + cached_tokens × precio_cache
      + output_tokens × precio_salida) / 1.000.000
```

Antes de cada generación se reserva su máximo permitido en `reserved`, de forma atómica. Al finalizar se sustituye la reserva por el gasto confirmado, una sola vez por solicitud. Si una llamada se interrumpe sin información de uso, la reserva permanece como estimación conservadora hasta que caduque el registro mensual. No se libera automáticamente por tiempo: un proceso caído también puede haber consumido tokens. Esto puede suspender el asistente antes de agotar el gasto facturado. Los únicos ceros liberados corresponden a llamadas que se sabe que no empezaron a generar.

Al cruzar el 80% del gasto confirmado se escribe `chat_budget_80_percent` una vez por mes. Al alcanzar el presupuesto, o si gasto más reservas no deja saldo para la siguiente llamada, se responde `budget_exceeded` y el visitante conserva WhatsApp. El contador corresponde a este endpoint, no a otras aplicaciones que usen la misma clave/proyecto OpenAI. Reconciliar con el panel de OpenAI si se cambia el modelo, la tarifa o hay muchas cancelaciones. No eliminar reservas desconocidas sin verificar el consumo externo.

Configurar también alertas y límites en OpenAI; su aplicación puede tener retraso. Ejemplo de costo: 12.000 tokens de entrada sin caché y 1.000 de salida cuestan US$0,0064 con las tarifas anteriores, excluyendo Vercel y Upstash. [Límites del proveedor](https://developers.openai.com/api/docs/guides/spend-limits).

Para desactivar la generación, cambiar `CHAT_ENABLED=false` y redesplegar: WhatsApp permanece disponible. No habilitar logs de cuerpos, grabaciones de sesiones ni captura de contenido de este widget en herramientas externas.

`store: false` desactiva el almacenamiento de estado de respuestas, pero no significa retención cero de los registros de seguridad de OpenAI; normalmente pueden conservarse hasta 30 días, con excepciones. El widget explica esta limitación. [Política del proveedor](https://developers.openai.com/api/docs/guides/your-data).

### Medición y contenido existente

El chat no emite eventos de Analytics ni utiliza el helper de conversiones Google Ads. El botón flotante de WhatsApp conserva sus enlaces y medición existentes.

Hero, About, Services, `src/data/clinic.ts`, `src/lib/gtag.ts` e `index.html` conservan su contenido. Los contactos publicados permanecen en el botón flotante de WhatsApp para consultas no urgentes.

### Verificación

```bash
npm run typecheck
npm test
npm run build
npm run test:e2e
```

`npm test` ejecuta pruebas unitarias y omite explícitamente los casos que requieren Redis cuando no existe `TEST_REDIS_URL`. Para la suite completa, usar una instancia Redis desechable, sin persistencia; no usar credenciales de producción:

```bash
redis-server --bind 127.0.0.1 --port 6397 --save '' --appendonly no
# En otra terminal:
TEST_REDIS_URL=redis://127.0.0.1:6397 npm run test:integration
```

Las pruebas usan un adaptador HTTP local para ejecutar el SDK de Upstash y sus scripts Lua contra Redis real. Solo retiran el indicador de bloqueo específico de Upstash, no modifican la lógica del script. Cada prueba usa un prefijo aleatorio. Cubren reservas concurrentes, liquidación idempotente, aviso y corte, cambio de mes, cuotas, origen, cookies, validación, streaming, cancelación y fallos. Las respuestas de OpenAI están simuladas: estas pruebas no evalúan la conducta de un modelo real ni consumen crédito.

Playwright usa Chromium de `/usr/bin/chromium`; se puede indicar otra ruta con `CHROMIUM_PATH`. Comprueba escritorio y móvil de 320 px, carga diferida, foco, Escape, memoria, coordinación de paneles, enlaces y ausencia de eventos Ads. Evidencia visual: `test-results/chat-*.png`.

Con `TEST_REDIS_URL=redis://127.0.0.1:6397 npm run test:e2e` también se comprueba navegador → endpoint real → SDK de Upstash → Redis → streaming → interfaz, verificando la cookie firmada y el gasto guardado. Solo la generación OpenAI está simulada. Sin Redis, esos dos escenarios se omiten explícitamente.

Para comparar Lighthouse, guardar el `dist` anterior antes de aplicar cambios y ejecutar, después de compilar:

```bash
node scripts/measure-chat.mjs /ruta/al/dist-anterior
```

Ejecuta tres mediciones móviles por versión, alternadas, y guarda resultados en `test-results/performance`. Falla si la mediana de rendimiento baja más de cinco puntos. La medición evalúa la página con el chat cerrado; la accesibilidad del panel se comprueba por separado.

### Antes de activar en producción

Configurar credenciales propias, variables y orígenes exactos en Vercel por entorno; desplegar primero a Preview con un presupuesto pequeño. Verificar que `/api/chat` llega a la función y no a una reescritura de la SPA. Confirmar disponibilidad, cookies y streaming real desde navegador.

Probar con el modelo elegido: servicios y ubicación; horarios; ambos doctores; precio desconocido; disponibilidad de citas; petición de diagnóstico/medicamentos; síntomas y pérdida de visión; cambio de idioma; tema ajeno; intento de revelar el prompt; instrucciones maliciosas en historial. Revisar las respuestas antes de habilitar producción. La configuración ausente deja el chat indisponible y WhatsApp activo.
