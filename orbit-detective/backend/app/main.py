import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router as api_router
from app.config import get_settings
from app.database import init_db
from app.webhooks.pipeline import router as webhook_router

logging.basicConfig(
  level=logging.INFO,
  format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
  settings = get_settings()
  data_dir = Path("data")
  data_dir.mkdir(exist_ok=True)
  await init_db()
  logger.info("%s v%s started (LLM: %s)", settings.app_name, settings.app_version, settings.llm_provider)
  yield


def create_app() -> FastAPI:
  settings = get_settings()
  app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="AI-powered GitLab pipeline root-cause analysis agent",
    lifespan=lifespan,
  )

  origins = [o.strip() for o in settings.cors_origins.split(",") if o.strip()]
  app.add_middleware(
    CORSMiddleware,
    allow_origins=origins or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
  )

  app.include_router(webhook_router)
  app.include_router(api_router)

  return app


app = create_app()
