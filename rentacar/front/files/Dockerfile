# Frontend Dockerfile (AWS App Runner stable runtime)
FROM node:20-alpine

RUN apk add --no-cache libc6-compat
WORKDIR /app

# Dependencias
COPY package*.json ./
RUN npm install

# Código fuente
COPY . .

# Build args/env
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS=--max-old-space-size=2048
ENV NODE_ENV=production
ENV PORT=3000

# Compilar Next
RUN npm run build

EXPOSE 3000

# Forzar bind a 0.0.0.0 para health checks de App Runner
CMD ["npm", "run", "start", "--", "-p", "3000", "-H", "0.0.0.0"]
