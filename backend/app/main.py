import time

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import OperationalError

from database import init_db
from routers import auth_router, vault_router

# Create FastAPI app
app = FastAPI(title="PQC Vault")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router.router)
app.include_router(vault_router.router)


@app.get("/")
def root():
    """Root endpoint."""
    return {"message": "PQC Vault API"}


@app.on_event("startup")
async def startup_event():
    """Initialize database on startup."""
    max_retries = 15
    for attempt in range(1, max_retries + 1):
        try:
            init_db()
            return
        except OperationalError:
            if attempt == max_retries:
                raise
            time.sleep(2)
