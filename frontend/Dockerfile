# Stage 1: Build
FROM node:20-alpine AS build

ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=${REACT_APP_API_URL}
ENV NODE_OPTIONS="--max-old-space-size=2048"
ENV GENERATE_SOURCEMAP=false

WORKDIR /app

COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY . .
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

COPY --from=build /app/build /usr/share/nginx/html

RUN echo 'gzip on; \
gzip_vary on; \
gzip_min_length 1024; \
gzip_comp_level 6; \
gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/javascript application/xml+rss application/json application/xml image/svg+xml; \
\
server { \
  listen 80; \
  root /usr/share/nginx/html; \
  index index.html; \
  \
  # Gzip static files \
  gzip_static on; \
  \
  # Cache static assets \
  location ~* \\.(?:jpg|jpeg|gif|png|ico|svg|webp)$ { \
    expires 1y; \
    add_header Cache-Control "public, immutable"; \
  } \
  \
  location ~* \\.(?:css|js)$ { \
    expires 1y; \
    add_header Cache-Control "public, immutable"; \
  } \
  \
  # SPA routing \
  location / { \
    try_files $uri $uri/ /index.html; \
    add_header Cache-Control "no-cache"; \
  } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
