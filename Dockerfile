FROM node:21

WORKDIR /app

# Copy package files first to optimize caching
COPY package*.json ./

# Install dependencies (adjust for production if needed)
RUN npm ci

# Copy the rest of the application code
COPY . .

# Expose Vite's default development port
EXPOSE 5173

# Use exec form for better signal handling
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
