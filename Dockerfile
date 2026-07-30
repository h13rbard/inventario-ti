FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Generar el cliente de Prisma
RUN npx prisma generate
EXPOSE 3000
# El script de inicio debe aplicar migraciones y levantar el server
CMD npx prisma db push && node server.js
