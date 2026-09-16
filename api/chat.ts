import { CLIENTS } from "../clients";

// One deployment serves every client - the client's own site sends its
// businessId so this function picks the right system prompt and origin
// allowlist from clients.ts. Add a new client there, no redeploy of new code.

interface ChatRequestBody {
  businessId?: string;
  message?: string;
  history?: { role: "user" | "assistant"; content: string }[];
}

export default async function handler(req: any, res: any) {
  const origin = req.headers.origin as string | undefined;

  if (req.method === "OPTIONS") {
    applyCors(res, origin, null);
    res.status(204).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  const body: ChatRequestBody = typeof req.body === "string" ? JSON.parse(req.body) : req.body ?? {};
  const { businessId, message } = body;
  const history = Array.isArray(body.history) ? body.history : [];
  const clientConfig = businessId ? CLIENTS[businessId] : undefined;

  if (!clientConfig) {
    res.status(404).json({ error: "unknown_business" });
    return;
  }

  applyCors(res, origin, clientConfig.allowedOrigins);
  if (origin && !clientConfig.allowedOrigins.includes(origin)) {
    res.status(403).json({ error: "origin_not_allowed" });
    return;
  }

  if (!message || typeof message !== "string" || message.length > 2000) {
    res.status(400).json({ error: "invalid_message" });
    return;
  }

  const trimmedHistory = history.slice(-clientConfig.maxTurnsPerConversation * 2);

  res.status(200).json({ reply: buildFaqReply(message, clientConfig.businessId) });
}

function buildFaqReply(message: string, businessId: string) {
  const question = message.toLowerCase();

  if (businessId === "la-nonita") {
    if (question.includes("sabor") || question.includes("gusto")) {
      return "Tenemos Lúcuma, Chicha Morada, Maracuyá, Aguaje, Camu Camu y Mango con Ají Amarillo. Para consultar disponibilidad o hacer un pedido, escríbenos por WhatsApp.";
    }
    return "Hola. Somos La Nonita, una marca artesanal de paletas de fruta con sabores peruanos. Hacemos los pedidos por WhatsApp y allí podemos confirmar precio, stock e información del pedido.";
  }

  if (question.includes("web") || question.includes("página") || question.includes("pagina")) {
    return "Creamos páginas web profesionales por 297€, con pago único. También podemos revisar tu presencia digital con una Auditoría por 147€. ¿Quieres que te orientemos hacia la opción más adecuada?";
  }
  if (question.includes("auditor") || question.includes("anuncio") || question.includes("google")) {
    return "La Auditoría cuesta 147€ y revisa tus anuncios, Perfil de Google y redes sociales. Es un buen primer paso para detectar oportunidades concretas de crecimiento.";
  }
  if (question.includes("precio") || question.includes("coste") || question.includes("costo") || question.includes("sistema")) {
    return "El Sistema de Crecimiento cuesta 200€ de configuración + 397€/mes. El Sistema Pro cuesta 400€ de configuración + 797€/mes. También ofrecemos páginas web y auditorías independientes.";
  }
  return "Hola. Puedo orientarte sobre páginas web, auditorías y sistemas de marketing con IA. También puedes pedir una Auditoría o escribirnos por WhatsApp al +34 676 282 991.";
}

function applyCors(res: any, origin: string | undefined, allowedOrigins: string[] | null) {
  if (origin && (allowedOrigins === null || allowedOrigins.includes(origin))) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}
