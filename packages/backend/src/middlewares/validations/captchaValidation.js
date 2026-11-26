import { AppError } from "../../errors/appError.js";
import ErrorCatalog from "../../errors/errorCatalog.js";

export const validarCaptcha = async (req, res, next) => {
  const tokenResponse = req.body.captcha;
  const ip = req.ip;

  if (!tokenResponse) {
    throw new AppError(ErrorCatalog.CAPTCHA_REQUERIDO, 400);
  }

  const payload = {
    secret: process.env.SECRET_KEY,
    response: tokenResponse,
    remoteip: ip,
    sitekey: process.env.SITE_KEY,
  };

  const params = new URLSearchParams(payload);
  const respuesta = await fetch("https://api.hcaptcha.com/siteverify", {
    method: "POST",
    body: params,
  });

  const j = await respuesta.json();

  console.log("hcaptcha: ", j);

  if (!j.success) {
    throw new AppError(ErrorCatalog.CAPTCHA_INVALIDO, 400);
  }

  next();
};
