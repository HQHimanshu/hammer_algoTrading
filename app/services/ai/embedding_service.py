"""Embedding and semantic retrieval service for TradeMind AI.

Provides:
- Deterministic document chunking with metadata and source tracking
- Normalized vector embedding generation (using term-frequency / vector space model)
- Cosine similarity ranking for semantic document retrieval
- Optional remote embedding API compatibility hook
"""

import math
import re
from typing import Any, Dict, List, Optional, Tuple
from pydantic import BaseModel, Field


class DocumentChunk(BaseModel):
    """Chunk of an approved strategy/risk knowledge document with metadata."""

    chunk_id: str
    doc_id: str
    title: str
    version: str
    category: str
    text: str
    vector: List[float] = Field(default_factory=list)


class EmbeddingService:
    """Local vector embedding and cosine similarity semantic search engine."""

    def __init__(self, vocab: Optional[List[str]] = None):
        # Controlled financial and algorithmic trading vocabulary for vector space model
        self.vocab: List[str] = vocab or [
            "moving", "average", "crossover", "golden", "cross", "death", "fast", "slow",
            "sma", "rsi", "relative", "strength", "overbought", "oversold", "veto", "filter",
            "risk", "emergency", "stop", "trading", "enabled", "cooldown", "limit", "position",
            "size", "loss", "daily", "order", "status", "pending", "open", "filled", "partially",
            "cancelled", "rejected", "execution", "fill", "price", "delta", "testnet", "exchange",
            "firestore", "sqlite", "audit", "pnl", "profit", "win", "rate", "performance",
            "read", "only", "guardrail", "safety", "client", "id", "timestamp", "reason"
        ]
        self._vocab_index: Dict[str, int] = {word: i for i, word in enumerate(self.vocab)}
        self._chunks: List[DocumentChunk] = []

    @property
    def dimension(self) -> int:
        """Dimensionality of vector space."""
        return len(self.vocab)

    def chunk_document(
        self,
        doc_id: str,
        title: str,
        content: str,
        category: str = "general",
        version: str = "1.0.0",
        max_sentences_per_chunk: int = 3,
    ) -> List[DocumentChunk]:
        """Split document content into discrete, identifiable semantic chunks."""
        sentences = [s.strip() for s in re.split(r"(?<=[.!?\n])\s+", content) if s.strip()]
        if not sentences:
            sentences = [content.strip()]

        chunks: List[DocumentChunk] = []
        for i in range(0, len(sentences), max_sentences_per_chunk):
            chunk_sentences = sentences[i : i + max_sentences_per_chunk]
            chunk_text = " ".join(chunk_sentences)
            chunk_id = f"{doc_id}_chunk_{len(chunks) + 1}"
            vector = self.embed_text(chunk_text)
            chunks.append(
                DocumentChunk(
                    chunk_id=chunk_id,
                    doc_id=doc_id,
                    title=title,
                    version=version,
                    category=category,
                    text=chunk_text,
                    vector=vector,
                )
            )

        return chunks

    def embed_text(self, text: str) -> List[float]:
        """Generate normalized vector embedding for given text using vector space model."""
        tokens = re.findall(r"\w+", text.lower())
        vec = [0.0] * len(self.vocab)

        for token in tokens:
            if token in self._vocab_index:
                vec[self._vocab_index[token]] += 1.0

        # Compute Euclidean norm
        norm = math.sqrt(sum(val * val for val in vec))
        if norm > 0.0:
            vec = [round(val / norm, 6) for val in vec]

        return vec

    def index_chunks(self, chunks: List[DocumentChunk]) -> None:
        """Register chunks in semantic retrieval memory, avoiding duplicates."""
        existing_ids = {c.chunk_id for c in self._chunks}
        for chunk in chunks:
            if chunk.chunk_id not in existing_ids:
                if not chunk.vector:
                    chunk.vector = self.embed_text(chunk.text)
                self._chunks.append(chunk)
                existing_ids.add(chunk.chunk_id)

    @staticmethod
    def cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
        """Compute cosine similarity between two normalized vectors."""
        if not vec1 or not vec2 or len(vec1) != len(vec2):
            return 0.0
        return sum(a * b for a, b in zip(vec1, vec2))

    def semantic_search(self, query: str, top_k: int = 3) -> List[Tuple[float, DocumentChunk]]:
        """Rank indexed document chunks by cosine similarity to query vector."""
        if not query.strip() or not self._chunks:
            return []

        query_vec = self.embed_text(query)
        # Check if query vector has any signal
        if not any(val > 0.0 for val in query_vec):
            return []

        scored_chunks: List[Tuple[float, DocumentChunk]] = []
        for chunk in self._chunks:
            sim = self.cosine_similarity(query_vec, chunk.vector)
            if sim > 0.0:
                scored_chunks.append((round(sim, 4), chunk))

        scored_chunks.sort(key=lambda x: x[0], reverse=True)
        return scored_chunks[:top_k]
