from app.services.ai_service import analyze_incident
from app.services.response_plan_service import generate_response_plan


def run_crisis_agent(report: str) -> dict:
    """
    Multi-step crisis decision agent.

    Step 1: Analyze incident
    Step 2: Calculate validated risk/priority
    Step 3: Retrieve trusted guidelines
    Step 4: Generate response plan
    Step 5: Combine everything into one decision package
    """

    # STEP 1 + STEP 2
    analysis = analyze_incident(report)

    # STEP 3 + STEP 4
    response_plan = generate_response_plan(
        incident_report=report,
        disaster_type=analysis["disaster_type"],
        severity=analysis["severity"]
    )

    # STEP 5
    decision = {
        "incident_analysis": analysis,

        "response_plan": {
            "immediate_actions": response_plan["immediate_actions"],
            "recommended_resources": response_plan["recommended_resources"],
            "safety_warnings": response_plan["safety_warnings"]
        },

        "knowledge_sources": response_plan["sources"],

        "agent_status": "Decision support generated",

        "human_review_required": True
    }

    return decision