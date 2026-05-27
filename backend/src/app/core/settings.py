from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_env: str = "dev"
    frontend_origin: str = "http://localhost:3000,http://127.0.0.1:3000,https://jayaremala.com,https://www.jayaremala.com"
    google_api_key: str = ""
    gemini_model: str = "gemini-2.5-flash"
    # Comma-separated fallback chain tried in order when primary hits 503/429
    gemini_fallback_models: str = "gemini-2.0-flash,gemini-2.0-flash-lite,gemini-flash-latest"
    # Persistent DB paths — set to absolute paths on the Lightsail volume (/data/)
    analytics_db_path: str = "./chroma_db/analytics.db"
    content_db_path: str = "./chroma_db/content.db"
    chroma_db_path: str = "./chroma_db"
    # Set ADMIN_TOKEN env var to enable POST /admin/reingest.
    # Empty string (default) disables the endpoint entirely.
    admin_token: str = ""

    @property
    def model_chain(self) -> list[str]:
        """Primary model first, then fallbacks (deduped, preserving order)."""
        seen: set[str] = set()
        chain = []
        for m in [self.gemini_model] + self.gemini_fallback_models.split(","):
            m = m.strip()
            if m and m not in seen:
                seen.add(m)
                chain.append(m)
        return chain


settings = Settings()

