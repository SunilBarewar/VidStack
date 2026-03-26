## syntax=docker/dockerfile:1.7

FROM node:20-bookworm-slim AS builder

WORKDIR /app

COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm npm install

COPY tsconfig.json ./
COPY src ./src
COPY .env ./

RUN npm run build
RUN npm prune --omit=dev

FROM node:20-bookworm-slim AS runner

ENV NODE_ENV=production

RUN apt-get update \
  && apt-get install -y --no-install-recommends ffmpeg \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

RUN mkdir -p /tmp/videos

ENTRYPOINT ["node", "dist/src/index.js"]
