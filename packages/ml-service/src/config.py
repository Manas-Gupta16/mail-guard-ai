"""
Mail Guard AI — ML Service Configuration

Loads settings from environment variables with sensible defaults.
"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """ML Service configuration."""

    # Server
    host: str = "0.0.0.0"  # noqa: S104
    port: int = 8000
    debug: bool = False

    # Model
    model_path: str = "./models/distilbert-spam-v2"
    model_version: str = "2.0.0"
    use_onnx: bool = True  # Use ONNX Runtime for faster inference

    # SHAP
    shap_max_tokens: int = 20  # Max tokens to return in SHAP explanation
    shap_background_samples: int = 100  # Number of background samples for SHAP

    # Feature extraction
    max_input_length: int = 5000  # Max characters to process

    model_config = {"env_prefix": "ML_", "env_file": ".env"}


settings = Settings()
