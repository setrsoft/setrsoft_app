# Production: build Vite SPA, serve with Nginx (see docker-compose.prod.yml service web).
FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG VITE_API_BASE=
ENV VITE_API_BASE=$VITE_API_BASE

ARG VITE_POSTHOG_KEY=
ENV VITE_POSTHOG_KEY=$VITE_POSTHOG_KEY

RUN npm run build

FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
