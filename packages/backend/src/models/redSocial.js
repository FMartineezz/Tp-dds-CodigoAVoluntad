export const TipoRedSocial = Object.freeze({
  INSTAGRAM: "instagram",
  LINKEDIN: "linkedin",
  GITHUB: "github",
  FACEBOOK: "facebook",
  X: "x",
  YOUTUBE: "youtube",
  TIKTOK: "tiktok",
});

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

export class RedSocial {
  constructor(tipo, url) {
    this.tipo = tipo;
    this.url = url;
  }
}
