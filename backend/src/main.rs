use std::net::SocketAddr;

use axum::{routing::get, Json, Router};
use serde_json::{json, Value};
use tower_http::trace::TraceLayer;
use tracing::info;

mod config;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    dotenvy::dotenv().ok();

    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "info,afh_backend=debug".into()),
        )
        .init();

    let cfg = config::Config::from_env()?;

    let app = Router::new()
        .route("/health", get(health))
        .layer(TraceLayer::new_for_http());

    let addr: SocketAddr = format!("0.0.0.0:{}", cfg.port).parse()?;
    let listener = tokio::net::TcpListener::bind(addr).await?;
    info!("listening on http://{}", addr);
    axum::serve(listener, app).await?;
    Ok(())
}

async fn health() -> Json<Value> {
    Json(json!({ "status": "ok" }))
}
