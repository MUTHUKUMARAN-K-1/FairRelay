"""
Fair Dispatch System - FastAPI Application
Main entry point for the API server.
"""

import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from starlette.responses import Response
from fastapi.staticfiles import StaticFiles

from app.config import get_settings
from app.api import (
    allocation_router,
    drivers_router,
    routes_router,
    feedback_router,
    driver_api_router,
    admin_router,
    admin_learning_router,
    allocation_langgraph_router,
    consolidation_router,
)
from app.api.agent_events import router as agent_events_router
from app.api.runs import router as runs_router

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("fairrelay.brain")

settings = get_settings()

# Path to frontend directory
FRONTEND_DIR = Path(__file__).parent.parent / "frontend"


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler for startup and shutdown events."""
    # Startup
    logger.info(f"Starting {settings.app_title} v{settings.app_version} (env={settings.app_env})")

    if not settings.is_production:
        try:
            from app.database import init_db
            await init_db()
            logger.info("Database tables initialized (dev mode)")
        except Exception as e:
            logger.warning(f"Database unavailable - running without persistence: {e}")
    else:
        # In production, just verify connectivity
        try:
            from app.database import check_db_health
            healthy = await check_db_health()
            if healthy:
                logger.info("Database connected successfully")
            else:
                logger.warning("Database health check failed - some endpoints may not work")
        except Exception as e:
            logger.warning(f"Database check failed: {e}")

    yield
    # Shutdown
    logger.info("Shutting down...")


# Create FastAPI application
app = FastAPI(
    title=settings.app_title,
    version=settings.app_version,
    description="""
    ## Fair Dispatch System API

    A fairness-focused route allocation system for delivery operations.

    ### Features
    - **Route Clustering**: Groups packages using K-Means for efficient routes
    - **Workload Scoring**: Calculates balanced workload metrics
    - **Fairness Metrics**: Computes Gini index and fairness scores
    - **Explainability**: Provides human-readable explanations for allocations
    - **LangGraph Workflow**: Multi-agent orchestration with LangSmith tracing

    ### Main Endpoints
    - `POST /api/v1/allocate` - Allocate packages to drivers (original)
    - `POST /api/v1/allocate/langgraph` - Allocate with LangGraph workflow
    - `POST /api/v1/consolidate` - AI Load Consolidation (5-agent LangGraph pipeline)
    - `POST /api/v1/consolidate/simulate` - Compare consolidation scenarios
    - `GET /api/v1/drivers/{id}` - Get driver details and stats
    - `GET /api/v1/routes/{id}` - Get route details
    - `POST /api/v1/feedback` - Submit driver feedback
    - `GET /api/v1/agent-events/stream` - SSE stream for agent events
    """,
    lifespan=lifespan,
    docs_url="/docs" if not settings.is_production else None,
    redoc_url="/redoc" if not settings.is_production else None,
)


# Global exception handler - prevent stack trace leaks in production
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error on {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
    )


# Add CORS middleware with configurable origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(allocation_router, prefix=settings.api_prefix)
app.include_router(allocation_langgraph_router, prefix=settings.api_prefix)
app.include_router(drivers_router, prefix=settings.api_prefix)
app.include_router(routes_router, prefix=settings.api_prefix)
app.include_router(feedback_router, prefix=settings.api_prefix)
app.include_router(driver_api_router, prefix=settings.api_prefix)
app.include_router(admin_router, prefix=settings.api_prefix)
app.include_router(admin_learning_router, prefix=settings.api_prefix)
app.include_router(consolidation_router, prefix=settings.api_prefix)

# Include SSE agent events router (no prefix - it defines its own)
app.include_router(agent_events_router)

# Include run-scoped endpoints
app.include_router(runs_router, prefix=settings.api_prefix)


@app.get("/", tags=["Health"])
async def root():
    """Root endpoint - health check."""
    return {
        "status": "healthy",
        "service": settings.app_title,
        "version": settings.app_version,
    }


@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint with actual DB verification."""
    from app.database import check_db_health
    db_ok = await check_db_health()
    status = "healthy" if db_ok else "degraded"
    return {
        "status": status,
        "database": "connected" if db_ok else "disconnected",
    }


# Mount static files and demo endpoints
if FRONTEND_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(FRONTEND_DIR)), name="static")

    NO_CACHE = {"Cache-Control": "no-cache, no-store, must-revalidate", "Pragma": "no-cache", "Expires": "0"}

    @app.get("/demo/allocate", tags=["Demo"])
    async def demo_allocate():
        """Serve the API demo page for testing allocation endpoint."""
        demo_path = FRONTEND_DIR / "demo.html"
        return FileResponse(demo_path, media_type="text/html", headers=NO_CACHE)

    @app.get("/demo/visualization", tags=["Demo"])
    async def demo_visualization():
        """Serve the agent visualization page."""
        viz_path = FRONTEND_DIR / "visualization.html"
        return FileResponse(viz_path, media_type="text/html", headers=NO_CACHE)

    @app.get("/demo/consolidation", tags=["Demo"])
    async def demo_consolidation():
        """Serve the 5-agent load consolidation pipeline visualization."""
        path = FRONTEND_DIR / "consolidation.html"
        return FileResponse(path, media_type="text/html", headers=NO_CACHE)
