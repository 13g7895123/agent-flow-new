FROM rust:1.85-slim AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends \
      pkg-config libssl-dev ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# 預熱依賴 cache：先 build 一個空殼把 dependencies 編好
COPY Cargo.toml Cargo.lock* ./
RUN mkdir src && echo "fn main() {}" > src/main.rs && \
    cargo build --release && \
    rm -rf src target/release/afh-backend target/release/deps/afh_backend*

# 真正 build
COPY src ./src
COPY migrations ./migrations
RUN touch src/main.rs && cargo build --release

FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends \
      ca-certificates wget \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=builder /app/target/release/afh-backend /usr/local/bin/afh-backend
COPY --from=builder /app/migrations ./migrations
EXPOSE 3001
CMD ["afh-backend"]
