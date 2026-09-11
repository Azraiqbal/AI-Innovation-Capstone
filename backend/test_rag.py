from app.services.rag_service import RAGService

rag = RAGService()

query = """
Flood area mein electric wires paani mein giri hui hain
aur log ghar mein phase hue hain.
"""

results = rag.search(query, top_k=5)

print("\n--- RAG RESULTS ---\n")

for i, result in enumerate(results, start=1):
    print(f"{i}. Source: {result['source']}")
    print(f"   Relevance: {result['relevance']}")
    print(f"   Content: {result['content']}")
    print()