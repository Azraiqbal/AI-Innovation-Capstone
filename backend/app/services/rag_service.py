from pathlib import Path

KNOWLEDGE_BASE = Path(__file__).resolve().parents[3] / "knowledge_base"

def search_knowledge(query: str, disaster_type: str = None, top_k: int = 3):
    results = []

    if not KNOWLEDGE_BASE.exists():
        return results

    for file in KNOWLEDGE_BASE.glob("*.txt"):
        if disaster_type and disaster_type.lower() not in file.stem.lower():
            continue

        text = file.read_text(encoding="utf-8")

        results.append({
            "source": file.name,
            "content": text[:1500],
            "score": 1.0
        })

        if len(results) >= top_k:
            break

    return results