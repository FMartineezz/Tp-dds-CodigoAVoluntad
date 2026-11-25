# Imagen de nginx que además trae el front ya empaquetado (dist).
# Se construye desde la RAÍZ del repo (context: .) porque el front es un workspace de npm y
# su lockfile es el package-lock.json de la raíz.

# ---------- 1) Build del front ----------
FROM node:20-alpine AS build-front
WORKDIR /repo

# Primero solo los manifiestos: si no cambian, Docker reutiliza la capa del npm ci.
# npm ci valida el lockfile contra TODOS los workspaces, por eso va también el del backend.
COPY package.json package-lock.json ./
COPY packages/frontend/package.json packages/frontend/
COPY packages/backend/package.json packages/backend/
RUN npm ci --workspace=packages/frontend --include-workspace-root=false

COPY packages/frontend packages/frontend

# Vite "hornea" las variables VITE_* en el bundle al compilar (no se leen en runtime).
# El front le pega al backend por /api (mismo dominio, nginx hace de proxy): sin CORS.
ARG VITE_API_URL=/api
ARG VITE_HCAPTCHA_SITEKEY
ARG VITE_API_APIKEY
ARG VITE_DEMO_COLECTIVO_ID=c00000000000000000000001
ARG VITE_DEMO_COLABORADORA_ID=a00000000000000000000005
ENV VITE_API_URL=$VITE_API_URL \
    VITE_DEMO_COLECTIVO_ID=$VITE_DEMO_COLECTIVO_ID \
    VITE_DEMO_COLABORADORA_ID=$VITE_DEMO_COLABORADORA_ID
RUN npm run build --workspace=packages/frontend

# ---------- 2) nginx sirviendo el dist ----------
FROM nginx:alpine
COPY --from=build-front /repo/packages/frontend/dist /usr/share/nginx/html
COPY deploy/nginx/site.conf.template /etc/nginx/site.conf.template
COPY deploy/nginx/start.sh /start.sh
CMD ["/bin/sh", "/start.sh"]
