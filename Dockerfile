FROM node:20-alpine AS frontend-build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps
COPY . .
ARG VITE_API_URL=""
RUN npm run build

FROM node:20-alpine AS backend-deps
WORKDIR /app/server
COPY server/package.json ./
RUN npm install --production

FROM node:20-alpine
RUN apk add --no-cache nginx

# Backend
WORKDIR /app/server
COPY --from=backend-deps /app/server/node_modules ./node_modules
COPY server/ ./
COPY src/data/*.json /app/src/data/

# Frontend
COPY --from=frontend-build /app/dist /var/www/yacht

# Nginx config
RUN mkdir -p /run/nginx
COPY <<'NGINX' /etc/nginx/http.d/yacht.conf
server {
    listen 80 default_server;
    server_name _;
    root /var/www/yacht;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /ws {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2)$ {
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript image/svg+xml;
}
NGINX

# Remove default nginx config
RUN rm -f /etc/nginx/http.d/default.conf

# Start script
COPY <<'ENTRYPOINT' /app/start.sh
#!/bin/sh
nginx
cd /app/server
exec node index.js
ENTRYPOINT
RUN chmod +x /app/start.sh

ENV PORT=3001
ENV DB_PATH=/app/data/yacht.db
VOLUME /app/data
EXPOSE 80

CMD ["/app/start.sh"]
