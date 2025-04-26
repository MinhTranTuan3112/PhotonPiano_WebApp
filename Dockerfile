# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

# Stage 2: Run
FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app /app

ENV NODE_ENV=production

EXPOSE 3000

CMD ["npx", "remix-serve", "./build/server/nodejs-eyJydW50aW1lIjoibm9kZWpzIn0/index.js"]
