FROM node:24-bookworm-slim AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY prisma.config.ts tsconfig.json ./
COPY prisma ./prisma
COPY src ./src

# Prisma config reads DATABASE_URL during generation; this build-only value is
# not persisted into the runtime image.
RUN DATABASE_URL="postgresql://localhost:5432/build" npm run prisma.generate \
    && npm run build

# Run this target once per release, before starting or replacing API replicas.
FROM build AS migration-deploy

ENV NODE_ENV=production

USER node

CMD ["npm", "run", "prisma.deploy"]

FROM node:24-bookworm-slim AS runtime

ENV NODE_ENV=production
ENV PORT=3000

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev \
    && npm cache clean --force

COPY --from=build --chown=node:node /app/dist ./dist

USER node

EXPOSE 3000

CMD ["npm", "start"]
