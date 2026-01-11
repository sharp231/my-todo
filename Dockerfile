# syntax=docker/dockerfile:1.7

FROM node:20-alpine AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# yarn を安定利用（yarn classic固定。corepackの毎回DLを抑える）
RUN corepack enable && corepack prepare yarn@1.22.22 --activate

# 依存関係のインストール
FROM base AS deps
COPY package.json yarn.lock ./
RUN --mount=type=cache,target=/root/.cache/yarn\
    yarn install --frozen-lockfile

# 開発用（ホットリロード）
FROM base AS dev
ENV NODE_ENV=development
# RUN corepack prepare yarn@stable --activate
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
CMD ["yarn", "dev", "-p", "3000"]

# ビルド用
FROM base AS builder
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN yarn build

# 本番実行用（standalone 推奨）
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]

# CI用（同じDockerfileでテスト実行）
FROM base AS ci
ENV NODE_ENV=test
COPY --from=deps /app/node_modules ./node_modules
COPY . .
CMD ["sh", "-lc", "yarn test"]
