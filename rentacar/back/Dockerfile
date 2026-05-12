# Backend Dockerfile (AWS compatible)
FROM node:20-alpine

# Crear directorio de trabajo
WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias
RUN npm ci --only=production

# Copiar el resto del código
COPY . .

# Exponer el puerto (App Runner/ECS usa la variable PORT)
ENV PORT=8080
EXPOSE 8080

# Comando para iniciar la aplicación
CMD ["node", "index.js"]
