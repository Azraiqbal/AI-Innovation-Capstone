def calculate_risk_score(
    severity: str,
    people_at_risk_count: int = 0,
    electrocution_risk: bool = False,
    fire_risk: bool = False,
    trapped_people: bool = False
) -> int:

    # Base score according to AI-detected severity
    severity_scores = {
        "LOW": 20,
        "MODERATE": 40,
        "HIGH": 65,
        "CRITICAL": 80
    }

    score = severity_scores.get(severity.upper(), 30)

    # Add risk based on number of people affected
    if people_at_risk_count > 0:
        score += min(people_at_risk_count, 10)

    # Extra danger factors
    if trapped_people:
        score += 5

    if electrocution_risk:
        score += 10

    if fire_risk:
        score += 10

    # Risk score cannot exceed 100
    return min(score, 100)


def get_priority(score: int) -> str:

    if score >= 85:
        return "P1 - Immediate"

    elif score >= 65:
        return "P2 - Urgent"

    elif score >= 40:
        return "P3 - Moderate"

    else:
        return "P4 - Low"