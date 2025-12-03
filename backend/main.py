from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

# Import routes
from routes.auth import router as auth_router
from routes.payments import router as payments_router
from routes.campaigns import router as campaigns_router
from routes.impressum import router as impressum_router
from routes.legal import router as legal_router
from routes.profile import router as profile_router

# Load environment variables
load_dotenv()

# Create FastAPI app
app = FastAPI(
    title="Voyanero API",
    description="Backend API for Voyanero SaaS Platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# Configure CORS
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://localhost:5173,http://frontend:3000,https://app.voyanero.com"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(payments_router)
app.include_router(campaigns_router)
app.include_router(impressum_router)
app.include_router(legal_router)
app.include_router(profile_router)


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "voyanero-api",
        "version": "1.0.0"
    }


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Welcome to Voyanero API",
        "docs": "/docs",
        "health": "/health"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
