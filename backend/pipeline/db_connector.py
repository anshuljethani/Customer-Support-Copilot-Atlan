import uuid
import datetime
from qdrant_client import QdrantClient, models
from qdrant_client.http.models import Distance, VectorParams, Field, PointStruct
from dotenv import load_dotenv

load_dotenv()
import os
from config import QDRANT_URL, QDRANT_API_KEY, QDRANT_COLLECTION, QDRANT_COLLECTION_2,QDRANT_COLLECTION_3,QDRANT_VECTOR_NAME
from config import OPENAI_EMBEDDING_MODEL, OPENAI_API_KEY

COLLECTION_NAME = QDRANT_COLLECTION_2
client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY) if QDRANT_API_KEY else QdrantClient(url=QDRANT_URL)
def push_ticket_point(
    ticket_id: str,
    subject: str,
    body: str,
    priority: str,
    topics: str,
    keywords: str,
    sentiment: str,
    created_at: datetime.datetime,
    vector: list[float]
):
    print(f"Pushing point with ticket_id: {ticket_id}")
    
    point_id = str(uuid.uuid4())

    point_payload = {
        "id": ticket_id,
        "subject": subject,
        "body": body,
        "priority": priority,
        "topics": topics,
        "keywords": keywords,
        "sentiment": sentiment,
        "created_at": created_at.isoformat()  
    }
    
    point_to_insert = PointStruct(
        id=point_id,  
        vector=vector,
        payload=point_payload
    )

    client.upsert(
        collection_name=COLLECTION_NAME,
        wait=True,
        points=[point_to_insert],
    )
    print(f"Successfully pushed point for ticket_id: {ticket_id}")