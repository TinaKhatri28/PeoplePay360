# Multi-stage production Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./
COPY prisma ./prisma/

RUN npm ci

COPY src ./src/
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

# Install curl for HEALTHCHECK
RUN apk add --no-cache curl

COPY package*.json ./
RUN npm ci --only=production

COPY prisma ./prisma/
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/dist ./dist

# Set permissions for node non-root user
RUN mkdir -p /app/data/uploads && chown -R node:node /app

USER node

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:4000/api/health || exit 1

CMD ["node", "dist/server.js"]

