# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build 

# Stage 2: Runtime
FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.env ./
COPY --from=builder /app/build ./build
COPY --from=builder /app/public ./public

RUN npm install 

EXPOSE 3000

#ENV NODE_ENV=production

CMD ["npm", "run", "start"]

#CMD ["npm", "run", "dev"]
