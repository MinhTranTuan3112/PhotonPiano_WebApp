# Stage 1: Build
FROM node:20 AS builder

# Install Chrome dependencies for Puppeteer
RUN apt-get update && apt-get install -y \
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
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
    wget \
    ca-certificates \
    libgbm-dev \
    libxshmfence-dev \
    libxfixes3 \
    && rm -rf /var/lib/apt/lists/*

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

# Install only the minimal dependencies needed for Puppeteer to run Chrome
RUN apt-get update && apt-get install -y \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libgcc1 \
    libglib2.0-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    lsb-release \
    wget \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

# Create a directory for Chrome to write to
RUN mkdir -p /tmp/chrome-user-data

WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/build ./build
RUN npm install --production

# Set environment variables for Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable
ENV NODE_ENV=production

# Download and install Chrome
RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y google-chrome-stable \
    && rm -rf /var/lib/apt/lists/*

EXPOSE 3000

CMD ["npx", "remix-serve", "./build/server/index.js"]