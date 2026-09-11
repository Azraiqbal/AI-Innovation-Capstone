import time

from fastapi import APIRouter, HTTPException, Depends

from app.schemas.incident import IncidentRequest
from app.services.agent_service import run_crisis_agent
from app.services.auth_service import get_current_user

from app.services.database_service import (
    save_incident,
    get_incidents,
    update_incident_status,
)


router = APIRouter(
    prefix="/api",
    tags=["Crisis AI Agent"]
)


# ==========================================
# CRISIS AI AGENT
# Protected endpoint
# ==========================================

@router.post("/crisis-agent")
def crisis_agent(
    payload: IncidentRequest,
    current_user: dict = Depends(get_current_user),
):
    try:
        start = time.time()

        print(
            "Authenticated user:",
            current_user.get("email")
        )

        # Run AI Crisis Agent
        result = run_crisis_agent(
            payload.report
        )

        ai_time = time.time() - start

        print(
            f"AI Agent Time: {ai_time:.2f} seconds"
        )


        # Extract incident analysis
        analysis = result.get(
            "incident_analysis",
            {}
        )

        print(
            "Analysis received:",
            analysis
        )


        # Save incident to Supabase
        db_start = time.time()

        saved_incident = save_incident(
            report=payload.report,
            analysis=analysis
        )

        db_time = (
            time.time() - db_start
        )

        total_time = (
            time.time() - start
        )


        print(
            "Saved Incident:",
            saved_incident
        )

        print(
            f"Database Time: {db_time:.2f} seconds"
        )

        print(
            f"Total Time: {total_time:.2f} seconds"
        )


        return result


    except HTTPException:
        raise


    except Exception as exc:

        print(
            "\n========== CRISIS AGENT ERROR =========="
        )

        print(
            type(exc).__name__
        )

        print(
            str(exc)
        )

        print(
            "========================================\n"
        )


        raise HTTPException(
            status_code=500,
            detail=f"{type(exc).__name__}: {str(exc)}"
        ) from exc


# ==========================================
# GET ALL INCIDENTS
# Protected endpoint
# ==========================================

@router.get("/incidents")
def fetch_incidents(
    current_user: dict = Depends(get_current_user),
):
    try:

        print(
            "Incidents requested by:",
            current_user.get("email")
        )

        incidents = get_incidents()


        return {
            "success": True,
            "count": len(incidents),
            "incidents": incidents
        }


    except HTTPException:
        raise


    except Exception as exc:

        print(
            "\n========== FETCH INCIDENTS ERROR =========="
        )

        print(
            type(exc).__name__
        )

        print(
            str(exc)
        )

        print(
            "===========================================\n"
        )


        raise HTTPException(
            status_code=500,
            detail=f"{type(exc).__name__}: {str(exc)}"
        ) from exc


# ==========================================
# UPDATE INCIDENT STATUS
# Protected endpoint
# ==========================================

@router.patch(
    "/incidents/{incident_id}/status"
)
def change_incident_status(
    incident_id: int,
    status: str,
    current_user: dict = Depends(
        get_current_user
    ),
):
    try:

        print(
            "Status update requested by:",
            current_user.get("email")
        )


        allowed_statuses = [
            "Active",
            "Resolved"
        ]


        if status not in allowed_statuses:

            raise HTTPException(
                status_code=400,
                detail=(
                    "Status must be Active "
                    "or Resolved."
                )
            )


        updated_incident = (
            update_incident_status(
                incident_id=incident_id,
                status=status
            )
        )


        return {
            "success": True,
            "incident": updated_incident
        }


    except HTTPException:
        raise


    except ValueError as exc:

        raise HTTPException(
            status_code=404,
            detail=str(exc)
        ) from exc


    except Exception as exc:

        print(
            "STATUS UPDATE ERROR:",
            exc
        )


        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to update "
                "incident status."
            )
        ) from exc