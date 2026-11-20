// Variables de entorno de la suite: sin SMTP (nodemailer usa su transporte JSON, que arma el mail
// sin enviarlo) y con una API key conocida para probar el rate limit de estadísticas.
delete process.env.SMTP_HOST;
process.env.MI_API_KEY = "clave-de-test";
