from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_env: str = "dev"
    frontend_origin: str = "http://localhost:3000,http://127.0.0.1:3000,https://jayaremala.com,https://www.jayaremala.com,https://gradevitian.jayaremala.com"
    google_api_key: str = ""
    # 2.0-flash is faster to first token than 2.5-flash; since answers are grounded
    # in retrieved context the quality gap is minimal. 2.5-flash stays as a fallback.
    gemini_model: str = "gemini-2.0-flash"
    # Comma-separated fallback chain tried in order when primary hits 503/429
    gemini_fallback_models: str = "gemini-2.5-flash,gemini-2.0-flash-lite,gemini-flash-latest"

    # Extra free providers appended to the fallback chain (OpenAI-compatible APIs).
    # Each is included only when its API key is set, so behaviour is unchanged otherwise.
    # Stacking these free tiers behind Gemini keeps the chatbot answering after
    # Gemini's daily quota is exhausted.
    groq_api_key: str = ""
    groq_models: str = "llama-3.3-70b-versatile,llama-3.1-8b-instant"
    openrouter_api_key: str = ""
    openrouter_models: str = "deepseek/deepseek-chat-v3-0324:free,meta-llama/llama-3.3-70b-instruct:free"
    # Persistent DB paths — set to absolute paths on the Lightsail volume (/data/)
    analytics_db_path: str = "./chroma_db/analytics.db"
    content_db_path: str = "./chroma_db/content.db"
    chroma_db_path: str = "./chroma_db"
    # gradeVITian student-tools app (gradevitian.jayaremala.com)
    gv_db_path: str = "./chroma_db/gradevitian.db"
    # Secret for signing gradeVITian auth tokens. Set GV_JWT_SECRET in prod;
    # empty falls back to an ephemeral per-process dev secret.
    gv_jwt_secret: str = ""
    # Public base URL of the gradeVITian site — used to build password-reset links so
    # they point at the SAME environment that created the token. Override locally
    # (e.g. http://localhost:3000/gradevitian) when testing the reset flow.
    gv_base_url: str = "https://gradevitian.jayaremala.com"
    # Second-pass LLM moderation for feedback comments (catches nuanced abuse the
    # keyword filter misses). Set false to rely on keywords only.
    gv_llm_moderation: bool = True
    # Set ADMIN_TOKEN env var to enable POST /admin/reingest.
    # Empty string (default) disables the endpoint entirely.
    admin_token: str = ""

    # Google OAuth2 — obtained from Google Cloud Console
    google_oauth_token_path: str = "/data/google_oauth_token.json"
    google_oauth_client_id: str = ""
    google_oauth_client_secret: str = ""

    # Gmail digest recipient (Jaya's email for weekly digest + lead-capture intros)
    gmail_digest_recipient: str = "venkatphanindra5@gmail.com"

    # Google Calendar settings
    calendar_id: str = "primary"
    calendar_tz: str = "America/New_York"

    @property
    def model_chain(self) -> list[str]:
        """Cross-provider fallback chain as `provider:model` entries, in priority
        order: Gemini first, then Groq, then OpenRouter (each included only when its
        key is set). Bare Gemini model names are auto-prefixed `gemini:`. Deduped,
        order preserved."""
        entries: list[str] = []
        # Gemini (always — keyed by google_api_key elsewhere)
        for m in [self.gemini_model, *self.gemini_fallback_models.split(",")]:
            m = m.strip()
            if m:
                entries.append(m if ":" in m else f"gemini:{m}")
        # Groq + OpenRouter free tiers — only if configured
        if self.groq_api_key:
            entries += [f"groq:{m.strip()}" for m in self.groq_models.split(",") if m.strip()]
        if self.openrouter_api_key:
            entries += [f"openrouter:{m.strip()}" for m in self.openrouter_models.split(",") if m.strip()]

        seen: set[str] = set()
        chain: list[str] = []
        for e in entries:
            if e not in seen:
                seen.add(e)
                chain.append(e)
        return chain


settings = Settings()

