from pathlib import Path
from sentence_transformers import SentenceTransformer
import faiss


class RAGService:
    def __init__(self):
        self.model = SentenceTransformer("all-MiniLM-L6-v2")
        self.documents = []
        self.index = None

        self._load_knowledge_base()
        self._build_index()

    def _load_knowledge_base(self):
        knowledge_base_path = Path(__file__).resolve().parents[3] / "knowledge_base"

        for file_path in knowledge_base_path.glob("*.txt"):
            content = file_path.read_text(encoding="utf-8")

            chunks = [
                line.strip()
                for line in content.splitlines()
                if line.strip()
            ]

            for chunk in chunks:
                self.documents.append({
                    "source": file_path.name,
                    "content": chunk
                })

    def _build_index(self):
        texts = [doc["content"] for doc in self.documents]

        embeddings = self.model.encode(
            texts,
            convert_to_numpy=True
        ).astype("float32")

        faiss.normalize_L2(embeddings)

        dimension = embeddings.shape[1]

        self.index = faiss.IndexFlatIP(dimension)
        self.index.add(embeddings)

    def search(
        self,
        query: str,
        top_k: int = 5,
        disaster_type: str | None = None
):
        query_embedding = self.model.encode(
            [query],
            convert_to_numpy=True
        ).astype("float32")

        faiss.normalize_L2(query_embedding)

        search_k = min(len(self.documents), top_k * 3)

        scores, indices = self.index.search(
            query_embedding,
            search_k
        )

        results = []

        for score, index in zip(scores[0], indices[0]):
            if index < 0:
                continue

            document = self.documents[index]

            # Disaster-specific filtering
            if disaster_type:
                expected_source = f"{disaster_type.lower()}_guidelines.txt"

                if document["source"].lower() != expected_source:
                    continue

            # Ignore very weak matches
            if float(score) < 0.25:
                continue

            results.append({
                "source": document["source"],
                "content": document["content"],
                "relevance": round(float(score), 3)
            })

            if len(results) >= top_k:
                break

        return results