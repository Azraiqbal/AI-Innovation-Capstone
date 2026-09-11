from fastapi import APIRouter, HTTPException

from app.schemas.incident import IncidentRequest, IncidentAnalysis
from app.services.ai_service import analyze_incident
from app.services.database_service import save_incident

router = APIRouter(
    prefix="/api",
    tags=["Incident Analysis"]
)


@router.post("/analyze-incident", response_model=IncidentAnalysis)
def analyze_disaster_incident(payload: IncidentRequest):
    try:
        result = analyze_incident(payload.report)

        # Convert result safely into dictionary
        if hasattr(result, "model_dump"):
            analysis_data = result.model_dump()
        else:
            analysis_data = result

        # Save incident in Supabase
        save_incident(
            report=payload.report,
            analysis=analysis_data
        )

        return result

    except Exception as exc:
        print("Incident Analysis Error:", exc)

        raise HTTPException(
            status_code=500,
            detail="AI incident analysis failed."
        ) from exc