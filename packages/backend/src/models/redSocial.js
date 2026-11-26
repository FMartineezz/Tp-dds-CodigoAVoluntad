/** Redes sociales que se pueden enlazar en perfiles de colectivos y personas. */
export const TipoRedSocial = Object.freeze({
  INSTAGRAM: "instagram",
  LINKEDIN: "linkedin",
  GITHUB: "github",
  FACEBOOK: "facebook",
  X: "x",
  YOUTUBE: "youtube",
  TIKTOK: "tiktok",
});

/**
 * @param {unknown} urlString
 * @returns {boolean} true si es una URL http o https.
 */
export function esUrlValida(urlString) {
  if (typeof urlString !== "string" || urlString.trim() === "") {
    return false;
  }
  try {
    const parsed = new URL(urlString);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/** Enlace a una red social. */
export class RedSocial {
  /**
   * @param {typeof TipoRedSocial[keyof typeof TipoRedSocial]} tipo
   * @param {string} url
   */
  constructor(tipo, url) {
    this.tipo = tipo;
    this.url = url;
  }
}
