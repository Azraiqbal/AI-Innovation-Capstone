from supabase import create_client

from app.core.config import (
    SUPABASE_URL,
    SUPABASE_SECRET_KEY
)


supabase = create_client(
    SUPABASE_URL,
    SUPABASE_SECRET_KEY
)


def save_incident(
    report: str,
    analysis: dict
) -> dict:

    incident_data = {
        "report": report,
        "language": analysis.get("language"),
        "disaster_type": analysis.get("disaster_type"),
        "severity": analysis.get("severity"),
        "risk_score": analysis.get("risk_score"),
        "priority": analysis.get("priority"),
        "people_at_risk_count": analysis.get(
            "people_at_risk_count",
            0
        ),
        "status": "Active",
        "summary": analysis.get("summary"),
    }

    response = (
        supabase
        .table("incidents")
        .insert(incident_data)
        .execute()
    )

    return response.data[0]

def get_incidents() -> list:
    response = (
        supabase
        .table("incidents")
        .select("*")
        .order("created_at", desc=True)
        .execute()
    )

    return response.data

def update_incident_status(incident_id: int, status: str) -> dict:
    response = (
        supabase
        .table("incidents")
        .update({"status": status})
        .eq("id", incident_id)
        .execute()
    )

    if not response.data:
        raise ValueError("Incident not found")

    return response.data[0]