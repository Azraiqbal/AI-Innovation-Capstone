from app.services.database_service import save_incident


fake_analysis = {
    "language": "Hinglish",
    "disaster_type": "Flood",
    "severity": "HIGH",
    "risk_score": 85,
    "priority": "P1 - Immediate",
    "people_at_risk_count": 5,
    "summary": "Test flood incident"
}


result = save_incident(
    report="Test incident for database connection",
    analysis=fake_analysis
)

print(result)