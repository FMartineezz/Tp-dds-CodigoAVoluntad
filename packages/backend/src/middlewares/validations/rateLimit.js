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
