import json

from app.services.rag_service import RAGService
from app.services.gemini_service import generate_with_retry


rag_service = RAGService()


DISASTER_TYPE_MAP = {
    "flood": "flood",
    "बाढ़": "flood",
    "बाढ़": "flood",
    "baadh": "flood",

    "fire": "fire",
    "आग": "fire",
    "aag": "fire",

    "earthquake": "earthquake",
    "भूकंप": "earthquake",
    "bhukamp": "earthquake"
}


def generate_response_plan(
    incident_report: str,
    disaster_type: str,
    severity: str
) -> dict:

    normalized_disaster_type = DISASTER_TYPE_MAP.get(
        disaster_type.lower().strip(),
        disaster_type.lower().strip()
    )

    query = f"""
    Disaster type: {normalized_disaster_type}
    Severity: {severity}
    Incident: {incident_report}
    """

    retrieved_guidelines = rag_service.search(
        query,
        top_k=5,
        disaster_type=normalized_disaster_type
    )

    context = "\n".join(
        [
            f"- {item['content']}"
            for item in retrieved_guidelines
        ]
    )

    prompt = f"""
You are an AI disaster-response decision-support assistant.

Incident:
{incident_report}

Disaster Type:
{normalized_disaster_type}

Severity:
{severity}

TRUSTED RESPONSE GUIDELINES:
{context}

Create a response plan grounded in the provided guidelines.

LANGUAGE RULE:
- Detect the exact language style of the incident report.
- English report -> reply in English.
- Hindi written in Devanagari -> reply in Hindi.
- Hinglish written using English/Roman letters -> reply in Hinglish using Roman letters.
- If the input is Hinglish, NEVER use Devanagari characters.
- Maintain the same language style used by the reporter.

Return ONLY valid JSON:

{{
    "immediate_actions": [
        "action 1",
        "action 2"
    ],
    "recommended_resources": [
        "resource 1",
        "resource 2"
    ],
    "safety_warnings": [
        "warning 1",
        "warning 2"
    ]
}}

Rules:
- Use the trusted guidelines as the primary basis.
- Do not invent emergency phone numbers.
- Do not claim that actions have already been performed.
- This is decision support for human responders.
- Keep instructions concise and practical.
"""

    response = generate_with_retry(prompt)

    raw_text = response.text.strip()

    if raw_text.startswith("```json"):
        raw_text = raw_text[7:]

    if raw_text.startswith("```"):
        raw_text = raw_text[3:]

    if raw_text.endswith("```"):
        raw_text = raw_text[:-3]

    plan = json.loads(raw_text.strip())

    plan["sources"] = retrieved_guidelines

    return plan