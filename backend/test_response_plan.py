from app.services.response_plan_service import generate_response_plan


report = """
Hamare area mein flood aa gaya hai.
10 log ghar mein phase hain aur electric wires
paani mein giri hui hain.
"""


result = generate_response_plan(
    incident_report=report,
    disaster_type="Flood",
    severity="CRITICAL"
)


print("\n--- AI RESPONSE PLAN ---\n")

print("Immediate Actions:")
for action in result["immediate_actions"]:
    print("-", action)


print("\nRecommended Resources:")
for resource in result["recommended_resources"]:
    print("-", resource)


print("\nSafety Warnings:")
for warning in result["safety_warnings"]:
    print("-", warning)


print("\nRAG Sources:")
for source in result["sources"]:
    print(
        f"- {source['source']} "
        f"({source['relevance']}): "
        f"{source['content']}"
    )