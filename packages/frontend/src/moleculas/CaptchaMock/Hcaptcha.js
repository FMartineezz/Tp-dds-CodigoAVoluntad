import { forwardRef } from "react";
import HCaptcha from "@hcaptcha/react-hcaptcha";
import s from "./CaptchaMock.module.css";

// `onChange` recibe el token (string) o '' si expiró / falló.
export const Captcha = forwardRef(function Captcha({ onChange, error }, ref) {
  return (
    <div className={s.captcha}>
      <HCaptcha
        ref={ref}
        sitekey={import.meta.env.VITE_HCAPTCHA_SITEKEY}
        languageOverride="es"
        onVerify={(token) => onChange(token)}
        onExpire={() => onChange("")}
        onError={() => onChange("")}
      />
      {error && <p className={s.error}>{error}</p>}
    </div>
  );
});
