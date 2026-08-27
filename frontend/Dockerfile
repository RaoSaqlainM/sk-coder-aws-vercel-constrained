FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./
RUN npm install --global pnpm@11.21.0 && pnpm install --config.onlyBuiltDependencies=esbuild
COPY . .
ARG VITE_API_URL=""
ARG VITE_WS_URL=""
ARG VITE_OWNER_DASHBOARD_HOST=""
ARG VITE_DEPLOYMENT_TIER=""
ARG BASE_PATH="/"
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_WS_URL=$VITE_WS_URL
ENV VITE_OWNER_DASHBOARD_HOST=$VITE_OWNER_DASHBOARD_HOST
ENV VITE_DEPLOYMENT_TIER=$VITE_DEPLOYMENT_TIER
ENV BASE_PATH=$BASE_PATH
RUN PORT=5173 BASE_PATH=/ pnpm run build

FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
