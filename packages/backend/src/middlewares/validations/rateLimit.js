import rateLimit from "express-rate-limit";

/**
 * Rate limit: 5 pedidos cada 20 minutos por IP (responde 429). Se saltea si el pedido trae
 * la API key de MI_API_KEY (header x-api-key o ?apiKey).
 */
export const limiter = rateLimit({
  windowMs: 20 * 60 * 1000,
  max: 5,
  message: {
    status: 429,
    message: "Demasiadas peticiones desde esta Ip. Intente de nuevo mas tarde",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req, res) => {
    const apiKey = req.header("x-api-key") || req.query.apiKey;

    // Sin MI_API_KEY configurada nadie se saltea el límite (antes undefined == undefined daba true)
    return Boolean(process.env.MI_API_KEY) && apiKey === process.env.MI_API_KEY;
  },
});

// Es otra instancia a propósito: cada una lleva su propia cuenta, así mandar reportes no
// gasta los pedidos de /estadisticas (y al revés). En los tests no corre: si no, se cortaría
// después del quinto POST.
/** Límite de POST /reportes: 5 cada 20 minutos por IP (responde 429). */
export const limiteDeReportes = rateLimit({
  windowMs: 20 * 60 * 1000,
  max: 5,
  message: {
    code: "ERR-LIM-001",
    message: "Mandaste muchos reportes seguidos. Probá de nuevo en un rato.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === "test",
});
