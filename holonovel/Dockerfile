# holonovel — container image (REQ-428)
#
# Runs the MCP host over stdio. The book-canonical content and the user data
# directory stay outside the image: mount a data directory and pass
# TTRPG_DATA_DIR if you need persistence across containers.
FROM node:24-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY tsconfig.json tsconfig.build.json ./
COPY src ./src
RUN npm run build

FROM node:24-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund && npm cache clean --force
COPY --from=build /app/dist ./dist
COPY bin ./bin
COPY content ./content
COPY holonovel.md tool-surface-registry.json tool-disambiguation.json NOTICE.md LICENSE.md ./

# The launcher starts the stdio MCP server; `help` prints usage and exits 0.
ENTRYPOINT ["node", "bin/holonovel.js"]
