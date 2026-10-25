"""Tests for vector embedding generation and semantic document retrieval."""

import pytest
from app.services.ai.document_ingestion import DocumentIngestionService
from app.services.ai.embedding_service import EmbeddingService


def test_embedding_service_chunking():
    """Verify document chunking breaks text into discrete chunks with identifiers."""
    svc = EmbeddingService()
    content = (
        "The Moving Average Crossover strategy uses two SMAs. Fast SMA is 5 periods and Slow SMA is 15 periods. "
        "Golden Cross generates a BUY signal when Fast SMA crosses above Slow SMA. "
        "Death Cross generates a SELL signal when Fast SMA crosses below Slow SMA. "
        "HOLD condition occurs when there is no crossover or RSI veto is triggered."
    )

    chunks = svc.chunk_document(
        doc_id="DOC-TEST-001",
        title="Test Strategy Rules",
        content=content,
        max_sentences_per_chunk=2,
    )
    assert len(chunks) >= 2
    assert chunks[0].doc_id == "DOC-TEST-001"
    assert chunks[0].chunk_id == "DOC-TEST-001_chunk_1"
    assert len(chunks[0].vector) == svc.dimension


def test_embedding_service_vector_normalization():
    """Verify generated embeddings are unit normalized (L2 norm = 1.0)."""
    svc = EmbeddingService()
    vec = svc.embed_text("algorithmic trading with exponential moving average crossover")
    assert len(vec) == svc.dimension

    # Compute Euclidean norm
    norm = sum(x * x for x in vec) ** 0.5
    assert pytest.approx(norm, rel=1e-3) == 1.0


def test_embedding_service_cosine_similarity():
    """Identical texts should have similarity ~1.0; unrelated texts should have lower similarity."""
    svc = EmbeddingService()
    text_a = "Dual EMA crossover strategy with fast period 9 and slow period 21"
    text_b = "Dual EMA crossover strategy with fast period 9 and slow period 21"
    text_c = "Fresh fruit salad recipe with apples and strawberries"

    sim_identical = svc.cosine_similarity(svc.embed_text(text_a), svc.embed_text(text_b))
    sim_unrelated = svc.cosine_similarity(svc.embed_text(text_a), svc.embed_text(text_c))

    assert pytest.approx(sim_identical, rel=1e-3) == 1.0
    assert sim_identical > sim_unrelated


def test_document_ingestion_semantic_search():
    """Verify DocumentIngestionService indexes corpus and retrieves semantically relevant sections."""
    ingestion = DocumentIngestionService()
    results = ingestion.semantic_search(query="How does the EMA crossover generate a BUY signal?", top_k=3)

    assert len(results) > 0
    sim_score, top_chunk = results[0]
    assert sim_score > 0.0
    assert top_chunk.chunk_id
    assert top_chunk.title
    assert top_chunk.text

    # Ensure strategy content was ranked highly for an EMA strategy query
    combined_content = " ".join([chunk.text for _, chunk in results]).lower()
    assert "cross" in combined_content or "crossover" in combined_content or "sma" in combined_content
