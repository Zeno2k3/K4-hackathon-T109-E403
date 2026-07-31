from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import slides

app = FastAPI(title="Glossary DB-First Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(slides.router)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
