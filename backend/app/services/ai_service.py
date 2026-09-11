import json

from app.services.risk_engine import calculate_risk_score, get_priority
from app.services.gemini_service import generate_with_retry

def analyze_incident(report: str) -> dict:
    prompt = f"""
You are an AI assistant for a disaster decision-support platform.

Analyze the incident carefully.

LANGUAGE RULE:
- Detect the user's language.
- Reply in the SAME language as the user's report.
- Hindi input -> Hindi response
- Hinglish input -> Hinglish response
- English input -> English response.

Incident Report:
{report}

Return ONLY valid JSON with exactly these fields:

{{
  "language": "detected language",
  "disaster_type": "type of disaster",
  "severity": "LOW | MODERATE | HIGH | CRITICAL",
  "people_at_risk_count": 0,
  "trapped_people": false,
  "electrocution_risk": false,
  "fire_risk": false,
  "main_risks": [
    "risk 1",
    "risk 2"
  ],
  "people_assets_at_risk": [
    "item 1",
    "item 2"
  ],
  "summary": "short summary"
}}

Rules:
- people_at_risk_count must be an integer.
- Use 0 if the exact count is unknown.
- trapped_people, electrocution_risk, fire_risk must be true or false.
- Keep all user-facing text in the user's language.
- Do not write anything outside JSON.
"""

    response = generate_with_retry(prompt)

    raw_text = response.text.strip()

    if raw_text.startswith("```json"):
        raw_text = raw_text[7:]

    if raw_text.startswith("```"):
        raw_text = raw_text[3:]

    if raw_text.endswith("```"):
        raw_text = raw_text[:-3]

    data = json.loads(raw_text.strip())

    risk_score = calculate_risk_score(
        severity=data["severity"],
        people_at_risk_count=data["people_at_risk_count"],
        trapped_people=data["trapped_people"],
        electrocution_risk=data["electrocution_risk"],
        fire_risk=data["fire_risk"]
    )

    data["risk_score"] = risk_score
    data["priority"] = get_priority(risk_score)

    return data