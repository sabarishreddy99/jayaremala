from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_env: str = "dev"
    frontend_origin: str = "http://localhost:3000,https://sabarishreddy99.github.io"
    google_api_key: str = ""
    gemini_model: str = "gemini-2.0-flash"
    # Comma-separated fallback chain tried in order when primary hits 503/429
    gemini_fallback_models: str = "gemini-2.0-flash,gemini-2.0-flash-lite,gemini-flash-latest"

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

