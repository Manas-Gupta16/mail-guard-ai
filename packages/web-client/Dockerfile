# Multi-stage build for React frontend
FROM node:20-slim AS build

WORKDIR /app

# Copy package.json only to ensure Linux AMD64 native binaries are resolved
COPY package.json ./
RUN npm install --no-package-lock

COPY . .
RUN npm run build

# Production Nginx server
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
