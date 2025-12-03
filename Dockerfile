# Build Stage
FROM node:20-slim AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Runtime Stage
FROM node:20-slim

WORKDIR /app

COPY --from=builder /app /app

# Install OpenSSL if needed
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
EXPOSE 5000

CMD ["npm", "start"]
