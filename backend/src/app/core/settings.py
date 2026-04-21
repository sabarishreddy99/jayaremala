from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_env: str = "dev"
    frontend_origin: str = "http://localhost:3000,https://sabarishreddy99.github.io"
    google_api_key: str = ""
    gemma_model: str = "gemini-2.5-flash"


settings = Settings()

