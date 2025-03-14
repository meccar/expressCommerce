FROM node:23-alpine3.21 AS builder

WORKDIR /app

COPY package.json ./
COPY .env.* .

RUN yarn install --only=production

COPY . .

RUN yarn build

FROM node:23-alpine3.21 AS runner

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

EXPOSE 8000

CMD ["yarn", "start:prod"]