FROM node:22-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends bash ca-certificates build-essential git python3 python3-venv tmux && rm -rf /var/lib/apt/lists/*
RUN npm install --global --no-audit --no-fund typescript tsx pnpm yarn && git config --system --add safe.directory /workspace && useradd --create-home --shell /bin/bash coder
USER coder
WORKDIR /workspace
