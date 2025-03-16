FROM node:23-alpine3.21 AS builder

WORKDIR /app

COPY package.json tsconfig.json ./
# COPY .env.* .
COPY . .

RUN yarn install --only=production

# COPY . .

RUN yarn build

# COPY tsconfig.json dist/

FROM node:23-alpine3.21 AS runner

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/tsconfig.json ./

EXPOSE 8000

CMD ["yarn", "start:prod"]