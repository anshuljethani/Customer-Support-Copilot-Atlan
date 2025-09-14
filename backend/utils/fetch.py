import os
import json
from fastapi import FastAPI
from qdrant_client import QdrantClient
from fastapi.responses import JSONResponse
from config import QDRANT_COLLECTION_2, OPENAI_API_KEY, QDRANT_URL, QDRANT_API_KEY

def fetch_tickets(limit=30):
    client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)

    points, _ = client.scroll(
        collection_name=QDRANT_COLLECTION_2,
        limit=limit,
        with_payload=True
    )

    results = []
    for p in points:
        payload = p.payload or {}
        results.append({
            "id": payload.get("id", ""),
            "subject": payload.get("subject", ""),
            "body": payload.get("body", ""),
            "priority": payload.get("priority", ""),
            "topics": payload.get("topics", ""),
            "keywords": payload.get("keywords", ""),
            "sentiment": payload.get("sentiment", ""),
            "created_at": payload.get("created_at", "")
        })

    return results
