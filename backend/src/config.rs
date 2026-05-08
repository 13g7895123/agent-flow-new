use anyhow::Result;

#[derive(Clone, Debug)]
pub struct Config {
    pub port: u16,
}

impl Config {
    pub fn from_env() -> Result<Self> {
        Ok(Self {
            port: parse_env_or("AFH_PORT", 3001),
        })
    }
}

fn parse_env_or<T: std::str::FromStr>(key: &str, default: T) -> T {
    std::env::var(key)
        .ok()
        .and_then(|s| s.parse().ok())
        .unwrap_or(default)
}
