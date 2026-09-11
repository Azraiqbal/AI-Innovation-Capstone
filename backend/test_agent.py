from app.services.agent_service import run_crisis_agent


report = """
Hamare area mein flood aa gaya hai.
10 log ghar mein phase hain aur electric wires
paani mein giri hui hain.
"""


result = run_crisis_agent(report)


print("\n========== CRISIS AI AGENT ==========\n")


analysis = result["incident_analysis"]

print("DISASTER TYPE:", analysis["disaster_type"])
print("SEVERITY:", analysis["severity"])
print("RISK SCORE:", analysis["risk_score"])
print("PRIORITY:", analysis["priority"])


print("\n--- IMMEDIATE ACTIONS ---")

for action in result["response_plan"]["immediate_actions"]:
    print("-", action)


print("\n--- RECOMMENDED RESOURCES ---")

for resource in result["response_plan"]["recommended_resources"]:
    print("-", resource)


print("\n--- SAFETY WARNINGS ---")

for warning in result["response_plan"]["safety_warnings"]:
    print("-", warning)


print("\n--- KNOWLEDGE SOURCES ---")

for source in result["knowledge_sources"]:
    print(
        f"- {source['source']} "
        f"({source['relevance']}): "
        f"{source['content']}"
    )


print("\nAgent Status:", result["agent_status"])
print("Human Review Required:", result["human_review_required"])