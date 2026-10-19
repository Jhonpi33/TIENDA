# ===========================================================================
# Dockerfile de la tienda: UN solo contenedor con la API y el frontend compilado.
# Igual que el despliegue de Render, pero corriendo en local (Mac, Windows, Linux).
#
#   docker compose up --build     ->  http://localhost:3000
#
# Multi-stage: la imagen final NO incluye fuentes, sólo backend/ + frontend/dist.
# ===========================================================================

# ---------------------------------------------------------------------------
# ETAPA 1 (build): compila el frontend (Vite) e instala dependencias del backend.
# Node 24 = mismo que "probado con" en el README; engines exige >= 20.
# ---------------------------------------------------------------------------
FROM node:24-slim AS build

WORKDIR /app

# 1) Frontend: sólo package*.json primero -> la capa de dependencias se
#    reutiliza mientras no cambien (builds mucho más rápidos).
COPY frontend/package.json frontend/package-lock.json ./frontend/
RUN npm --prefix frontend ci

# 2) Fuentes del frontend y build de producción (Vite -> frontend/dist).
COPY frontend/ ./frontend/
RUN npm --prefix frontend run build

# 3) Backend: dependencias de producción (sin devDependencies).
COPY backend/package.json backend/package-lock.json ./backend/
RUN npm --prefix backend ci --omit=dev

# ---------------------------------------------------------------------------
# ETAPA 2 (runtime): imagen mínima, sin fuentes ni caché de npm.
# ---------------------------------------------------------------------------
FROM node:24-slim

ENV NODE_ENV=production \
    PORT=3000

WORKDIR /app

# Dependencias del backend ya instaladas en la etapa anterior.
COPY --from=build --chown=node:node /app/backend/package.json /app/backend/package-lock.json ./backend/
COPY --from=build --chown=node:node /app/backend/node_modules ./backend/node_modules

# Código del backend (server.js lee MONGODB_URI del entorno; sin .env dentro
# de la imagen: docker-compose inyecta backend/.env en runtime).
COPY --chown=node:node backend/src ./backend/src

# Frontend compilado: app.js resuelve ../../frontend/dist desde backend/src,
# así que la estructura DEBE ser /app/backend + /app/frontend/dist.
COPY --from=build --chown=node:node /app/frontend/dist ./frontend/dist

# Usuario sin privilegios (la imagen oficial trae el usuario "node").
USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/api/salud').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "backend/src/server.js"]
