import rateLimit from "express-rate-limit";

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

    return apiKey == process.env.MI_API_KEY;
  },
});
