import os
import traceback
from flask import Flask, request, jsonify
from flask_cors import CORS
import uuid
from qdrant_client import QdrantClient
from services.llm_service import generate_llm_response
from services.qdrant_service import search_text, insert_point, retrieve_llm_responses_by_user,embed_text
from pipeline.ai_pipeline import ai_pipeline
from pipeline.ml_processing import _pipelines
from utils.fetch import fetch_tickets
from config import FRONTEND_ORIGIN, QDRANT_TOP_K
from config import QDRANT_URL, QDRANT_API_KEY, QDRANT_COLLECTION, OPENAI_API_KEY, QDRANT_COLLECTION_2, QDRANT_COLLECTION_3

# Initialize the Flask application
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Initialize Qdrant client with error handling
try:
    qdrant_client = QdrantClient(
        url=os.getenv("QDRANT_URL"),
        api_key=os.getenv("QDRANT_API_KEY")
    )
except Exception as e:
    print(f"Warning: Could not initialize Qdrant client: {e}")
    qdrant_client = None

@app.route('/input', methods=['POST'])
def handle_input():
    try:
        data = request.json
        if not isinstance(data, list):
            return jsonify({"error": "Invalid JSON format. Expected a list of objects."}), 400
            
        processed_data = ai_pipeline(data)
        
        if any("error" in item for item in processed_data):
            # If any item failed to process, return a 500
            return jsonify(processed_data), 500
        
        return jsonify(processed_data), 200

    except Exception as e:
        # Catch any exceptions during request parsing or pipeline execution
        print("An error occurred:")
        traceback.print_exc() # This will print the full traceback to your terminal
        return jsonify({"error": "Internal server error. Check the server logs for details."}), 500

@app.route("/chat", methods=["POST"])
def chat():
    try:
        data = request.get_json() or {}
        text = data.get("text", "").strip()
        user_id = data.get("user_id", "").strip()
        
        if not text:
            return jsonify({"error": "No text provided"}), 400
            
        # Check if Qdrant client is available
        if qdrant_client is None:
            # Return mock response when Qdrant is not available
            mock_response = f"I received your message: '{text}'. This is a mock response since the AI services are not fully configured. User ID: {user_id}"
            return jsonify({
                "user_id": user_id,
                "LLM_Response": mock_response,
                "Cited_URLs": ["https://docs.atlan.com/get-started/what-is-atlan"]
            })
        
        top_k = 5
        search_results = search_text(query=text, k=top_k)
        print(search_results)

        try : 
            previous_responses = retrieve_llm_responses_by_user(client=qdrant_client,user_id=user_id,input_text=text)
            print("we got the prev responses")
        except Exception as e:
            previous_responses=[]
            print("cant load prev responses endpoint error:", e)

        if previous_responses:
            llm_output = generate_llm_response(
                user_text=text,
                responses=previous_responses,
                results=search_results
            )
        else:
            
            llm_output = generate_llm_response(
                user_text=text,
                responses=[],  
                results=search_results,
            )

        llm_response = llm_output.get("LLM_Response", "")
        cited_urls = llm_output.get("Cited_URLs", [])

        metadata = {
                "user_id": user_id,
                "user_query": text,
                "llm_response": llm_response,
                "cited_urls": cited_urls,
                "timestamp": str(uuid.uuid1().time) 
            }
        
        try:
            insert_point(
                client=qdrant_client,
                user_id=user_id,
                input_text=text,
                llm_response=llm_response
            )
        except Exception as insert_error:
            print("Failed to insert Qdrant point:", traceback.format_exc())
            print("Insert error details:", str(insert_error))

        response_data = {
            "user_id": user_id,
            "LLM_Response": llm_response,
            "Cited_URLs": cited_urls
        }
        return jsonify(response_data)
        
    except Exception as e:
        print("Chat endpoint error:", e)
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route("/health", methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "message": "Server is running"})

@app.route("/fetch",  methods=['GET', 'POST'])
def get_tickets(limit: int = 30):
    try:
        tickets = fetch_tickets(limit)
        return jsonify(tickets)
    except Exception as e:
        print(f"Error fetching tickets: {e}")
        # Return mock data for testing
        mock_tickets = [
            {
                "id": "TICKET-001",
                "subject": "Database Connection Issue",
                "body": "Users are experiencing intermittent database connection timeouts during peak hours.",
                "priority": "P0",
                "topics": "Errors, Database",
                "keywords": "database, connection, timeout, performance",
                "sentiment": "Frustrated",
                "created_at": "2024-01-15T10:30:00Z"
            },
            {
                "id": "TICKET-002", 
                "subject": "How to configure SSO",
                "body": "Customer needs help setting up single sign-on integration with their identity provider.",
                "priority": "P1",
                "topics": "How-to, SSO",
                "keywords": "sso, configuration, identity, provider",
                "sentiment": "Curious",
                "created_at": "2024-01-15T09:15:00Z"
            },
            {
                "id": "TICKET-003",
                "subject": "API Rate Limiting Question",
                "body": "What are the current rate limits for the REST API endpoints?",
                "priority": "P2",
                "topics": "API/SDK, Documentation",
                "keywords": "api, rate, limit, rest, endpoints",
                "sentiment": "Confused",
                "created_at": "2024-01-15T08:45:00Z"
            },
            {
                "id": "TICKET-004",
                "subject": "Data Lineage Visualization",
                "body": "The data lineage graph is not showing all the connections between tables.",
                "priority": "P1",
                "topics": "Lineage, Visualization",
                "keywords": "lineage, graph, connections, tables, visualization",
                "sentiment": "Anxious",
                "created_at": "2024-01-15T07:20:00Z"
            },
            {
                "id": "TICKET-005",
                "subject": "Integration with Salesforce",
                "body": "Need assistance with setting up the Salesforce connector for data ingestion.",
                "priority": "P1",
                "topics": "Integrations, Connector",
                "keywords": "salesforce, connector, integration, data, ingestion",
                "sentiment": "Hopeful",
                "created_at": "2024-01-15T06:30:00Z"
            },
            {
                "id": "TICKET-006",
                "subject": "Urgent: System Down",
                "body": "The entire system is down and customers cannot access their data. This needs immediate attention.",
                "priority": "P0",
                "topics": "Errors, Product",
                "keywords": "system, down, urgent, customers, data",
                "sentiment": "Urgent",
                "created_at": "2024-01-15T05:45:00Z"
            },
            {
                "id": "TICKET-007",
                "subject": "Best Practices for Data Governance",
                "body": "Looking for guidance on implementing proper data governance practices in our organization.",
                "priority": "P2",
                "topics": "Best practices, Glossary",
                "keywords": "governance, practices, organization, guidance",
                "sentiment": "Curious",
                "created_at": "2024-01-15T04:30:00Z"
            },
            {
                "id": "TICKET-008",
                "subject": "Sensitive Data Handling",
                "body": "How should we handle PII and other sensitive data in our data catalog?",
                "priority": "P1",
                "topics": "Sensitive data, Product",
                "keywords": "pii, sensitive, data, catalog, handling",
                "sentiment": "Anxious",
                "created_at": "2024-01-15T03:15:00Z"
            }
        ]
        return jsonify(mock_tickets[:limit])

if __name__ == '__main__':
    app.run(port=8081, debug=True)


