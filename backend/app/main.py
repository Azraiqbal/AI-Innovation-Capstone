from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.incident import router as incident_router
from app.api.agent import router as agent_router


app = FastAPI(
    title="AI Innovation Capstone",
    description="AI Crisis Decision Intelligence Platform",
    version="1.0.0"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(incident_router)
app.include_router(agent_router)


@app.get("/")
def root():
    return {
        "message": "AI Innovation Capstone API is running"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "backend"
    }