FROM node:20-alpine

ENV NODE_OPTIONS="--max-old-space-size=512"

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production --legacy-peer-deps && npm cache clean --force

COPY . .

RUN mkdir -p uploads/contracts uploads/logos uploads/quotations

EXPOSE 4000

CMD ["node", "src/server.js"]
