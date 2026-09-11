from app.services.ai_service import analyze_incident

report = """
Hamare area mein heavy baarish ke baad bahut paani bhar gaya hai.
Lagbhag 12 log gharon mein phase hue hain aur electric wires
paani mein giri hui hain.
"""

result = analyze_incident(report)

print("\n--- STRUCTURED AI ANALYSIS ---\n")

print("Language:", result["language"])
print("Disaster Type:", result["disaster_type"])
print("Severity:", result["severity"])
print("Risk Score:", result["risk_score"])
print("Priority:", result["priority"])

print("\nMain Risks:")
for risk in result["main_risks"]:
    print("-", risk)

print("\nPeople / Assets at Risk:")
for item in result["people_assets_at_risk"]:
    print("-", item)

print("\nSummary:")
print(result["summary"])