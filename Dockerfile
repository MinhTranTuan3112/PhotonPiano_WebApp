# Stage 1: Build
FROM node:20-alpine AS builder

RUN apt-get update && apt-get install -y \
    wget \
    ca-certificates \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libgdk-pixbuf2.0-0 \
    libnspr4 \
    libnss3 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
    libu2f-udev \
    chromium

WORKDIR /app

COPY package*.json ./
RUN npm install

# Add ARG statements for build-time variables
ARG VITE_API_BASE_URL
ARG VITE_COOKIE_SECRET
ARG VITE_IS_DEVELOPMENT
ARG VITE_PINATA_API_KEY
ARG VITE_PINATA_API_SECRET
ARG VITE_PINATA_GATEWAY_KEY
ARG VITE_PINATA_GATEWAY_BASE_URL
ARG VITE_API_PUB_SUB_URL
ARG VITE_API_NOTIFICATION_URL
ARG VITE_API_PROGRESS_URL

# Set them as environment variables during build
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_COOKIE_SECRET=${VITE_COOKIE_SECRET}
ENV VITE_IS_DEVELOPMENT=${VITE_IS_DEVELOPMENT}
ENV VITE_PINATA_API_KEY=${VITE_PINATA_API_KEY}
ENV VITE_PINATA_API_SECRET=${VITE_PINATA_API_SECRET}
ENV VITE_PINATA_GATEWAY_KEY=${VITE_PINATA_GATEWAY_KEY}
ENV VITE_PINATA_GATEWAY_BASE_URL=${VITE_PINATA_GATEWAY_BASE_URL}
ENV VITE_API_PUB_SUB_URL=${VITE_API_PUB_SUB_URL}
ENV VITE_API_NOTIFICATION_URL=${VITE_API_NOTIFICATION_URL}
ENV VITE_API_PROGRESS_URL=${VITE_API_PROGRESS_URL}

COPY . .

RUN npm run build
# Debug: List build output
RUN ls -la /app/build /app/build/server || echo "Server directory not found"

# Stage 2: Run
FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/build ./build
RUN npm install --production

ENV NODE_ENV=production

EXPOSE 3000

CMD ["npx", "remix-serve", "./build/server/index.js"]