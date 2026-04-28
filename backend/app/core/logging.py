import sys
import yaml
from pathlib import Path
from loguru import logger
from app.core.config import settings

def setup_logging():
    config_path = Path("config/logging.yaml")
    if config_path.exists():
        try:
            with open(config_path) as f:
                config = yaml.safe_load(f)
            logger.remove()  # reset

            # Console sink
            console_cfg = config.get("console", {})
            logger.add(
                sys.stdout,
                format=console_cfg.get("format", "{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} - {message}"),
                level=console_cfg.get("level", "DEBUG" if settings.DEBUG else "INFO"),
                colorize=console_cfg.get("colorize", True),
            )

            # File sink
            file_cfg = config.get("file", {})
            if file_cfg.get("enabled", True):
                file_path = file_cfg.get("path", "logs/app.log")
                logger.add(
                    file_path,
                    rotation=file_cfg.get("rotation", "500 MB"),
                    retention=file_cfg.get("retention", "10 days"),
                    level=file_cfg.get("level", "INFO"),
                    format=file_cfg.get("format", "{time} | {level} | {message}"),
                    serialize=file_cfg.get("json", False),
                )
        except Exception:
            # Fallback to basic logging
            logger.remove()
            logger.add(sys.stdout, level="INFO")
            logger.error("Failed to load logging config, using basic console logger")
    else:
        # Default logging (same as Phase 1)
        logger.remove()
        logger.add(
            sys.stdout,
            format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} - {message}",
            level="DEBUG" if settings.DEBUG else "INFO",
            colorize=True,
        )
        logger.add(
            "logs/app.log",
            rotation="500 MB",
            retention="10 days",
            level="INFO",
            format="{time} | {level} | {message}",
        )

    logger.info("Logging configured successfully")
