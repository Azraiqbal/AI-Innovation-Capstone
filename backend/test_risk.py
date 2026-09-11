from app.services.risk_engine import calculate_risk_score, get_priority


score = calculate_risk_score(
    severity="CRITICAL",
    people_at_risk_count=10,
    trapped_people=True,
    electrocution_risk=True,
    fire_risk=False
)

priority = get_priority(score)

print("\n--- RISK ENGINE TEST ---\n")
print("Risk Score:", score)
print("Priority:", priority)