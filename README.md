# Customer Support Copilot 🚀

The Customer Support Copilot is an enterprise-grade solution that automates the entire support ticket lifecycle - from ingestion and intelligent processing to visualization and AI-powered assistance. The system leverages cutting-edge technologies including Transformers, Vector Search, LLM Integration, and Real-time Analytics to deliver unprecedented insights into customer support operations.

---

## ✨ Key Capabilities

| Feature | Description |
|---------|-------------|
| 🤖 **AI/ML-Powered Ticket Processing** | Automatic priority classification, sentiment analysis, and topic extraction |
| 🔍 **Intelligent Vector Search** | Semantic search across knowledge base using vector mappings and retrievals (Qdrant) |
| 💬 **Conversational AI Assistant** | Context-aware support with conversation history |
| 📊 **Advanced Analytics Dashboard** | Interactive visualizations with real-time insights |
| ⚡ **High-Performance Architecture** | Scalable microservices with optimized data flow |

---

## 🏗️ System Architecture

![IMG_3233](https://github.com/user-attachments/assets/e9ecde67-0dba-4fd6-b225-f0243cfd063e)


![IMG_3235](https://github.com/user-attachments/assets/e043ed4e-7bcf-4072-8bb1-c31e99186b46)


### **Core Philosophy: The Power of Three**

This system is built on a fundamental architectural principle - **only 3 core API calls** handle the entire data processing pipeline:

![IMG_3231](https://github.com/user-attachments/assets/b4a08655-4572-4bb2-a34f-3553802bcfea)


> This elegant simplicity ensures maintainability, scalability, and performance while delivering enterprise-grade functionality.

---

## 🧠 Backend Architecture

### **1. ML Processing Pipeline**

![IMG_3232](https://github.com/user-attachments/assets/7360b46a-7503-4bcc-8240-e4957a6a252f)

#### **`ai_pipeline.py`**
- Coordinates entire AI processing pipeline from raw input to database storage
- Validates incoming ticket data, handles format normalization
- Manages communication between ml_processing.py and db_connector.py

#### **`ml_processing.py`**
- Runs HuggingFace models in parallel (Priority, Sentiment, Topic, Intent)
- Handles multiple tickets simultaneously for efficiency
- Returns standardized JSON with classifications 

#### **`db_connector.py`**
- Converts ML outputs into Qdrant-compatible vector points
- Structures and stores ticket metadata with proper indexing
- Handles efficient batch insertion of processed tickets into Qdrant

The system employs **4 concurrent HuggingFace transformer models** for comprehensive ticket analysis:

- **Priority Classification** - Automatically determines ticket urgency from body
- **Sentiment Analysis** - Extracts customer emotional state from body and subject  
- **Topic Extraction** - Identifies key themes and categories from subject
- **Keyword Extraction** - Identifies keywords from body and subject

### **2. Services Layer (`/services/`)**

![IMG_3237](https://github.com/user-attachments/assets/18d7860f-c6b0-4bfd-8b7f-66a740413b9d)


#### **`llm_service.py`**
- Handles LLM response generation
- Manages conversation context and history given by qdrant
- Implements connector issue detection and classification

#### **`qdrant_service.py`**
- **Search**: Semantic similarity search across ticket database
- **Insert**: Adds new vector embeddings to collection
- **Retrieve**: Fetches specific points from vector database
- **Process**: 
  - Semantic search via `qdrant_service.py[text]` (top 3 similar tickets)
  - Semantic search via `qdrant_service.py[user_id]` (top 3 LLM responses)
  - Context-aware response via `llm_service.py`
  - Returns enriched response with ticket references

### **3. Utils Layer (`/utils/`)**

![IMG_3238](https://github.com/user-attachments/assets/b4e8b413-34be-4d40-84aa-8f2f7a926f6d)


#### **`fetch.py`**
- Retrieves processed tickets from Qdrant
- Serves data to frontend analytics dashboard
- Implements efficient querying strategies

---

## 🎨 Frontend Architecture

### **Frontend Technologies**

| Technology | Purpose |
|------------|---------|
| **Core** | Vanilla JavaScript (ES6+) for optimal performance |
| **Visualization** | Chart.js 3.x with custom animations |
| **Styling** | Modern CSS3 with Glass Morphism effects |
| **UI/UX** | Responsive design with micro-interactions |

---

## 🎯 Design Decisions & Trade-offs

### **✅ Current Architecture Strengths**

- **Simplicity**: 3-endpoint design ensures maintainability
- **Modularity**: Clear separation of concerns across components
- **Scalability**: Microservices architecture enables horizontal scaling
- **Database Decision**: Qdrant open-source benefits
- **ML Model Strategy**: HuggingFace vs LLM-for-everything approach
- **Single Responsibility**: Modular design with easy component swapping
- **Simple Deployment**: Flask dual-port architecture
- **Frontend Simplicity**: Vanilla tech stack advantages

### **🔄 Identified Optimization Opportunities**

#### **1. Filtering Strategy**
- **Current**: Frontend-based filtering using JavaScript
- **Trade-off**: Client-side flexibility vs server-side performance
- **Alternative**: Qdrant-based Python filtering with query parameters
- **Benefit**: Reduced data transfer, faster response times for large datasets

#### **2. Database Architecture**
- **Current**: Qdrant for all ticket storage and operations
- **Trade-off**: Vector search optimization vs SQL query flexibility
- **Alternative**: PostgreSQL for bulk operations + Qdrant for vector search
- **Benefit**: Better SQL-based filtering, improved bulk operations, relational data integrity

#### **3. ML Processing Pipeline**
- **Current**: 4 concurrent HuggingFace models running synchronously
- **Trade-off**: Comprehensive analysis vs processing speed
- **Alternative**: Personalized/Fine-tuned HuggingFace models OR training custom models from scratch with domain-specific datasets
- **Benefit**: Reduced processing time from 3-4 seconds per ticket to <1 second, improved accuracy for support-specific tasks

#### **4. RAG Retrieval Strategy**
- **Current**: Top-5 vector similarity search for all queries
- **Trade-off**: Fixed retrieval count vs query-adaptive results
- **Alternative**: Dynamic retrieval with hybrid search (vector + keyword)
- **Benefit**: More relevant results, better context quality for complex queries

#### **5. LLM Service Optimization**
- **Current**: Full LLM processing for all query types including simple classifications
- **Trade-off**: Response quality vs processing efficiency
- **Alternative**: Lightweight HuggingFace classification models for connector issues
- **Benefit**: Faster response times, reduced API costs, maintained accuracy

#### **6. API Key Management**
- **Current**: Single API key per service with potential rate limiting
- **Trade-off**: Simplicity vs availability resilience
- **Alternative**: Round-robin API key rotation with load balancing
- **Benefit**: Better rate limit handling, improved service availability, cost distribution

---

## 📊 Performance Metrics

### **Current Performance**
| Metric | Current | Target |
|--------|---------|--------|
| **Ticket Processing** | ~3-4 seconds (4 ML models) | <1 second |
| **Vector Search** | ~100-200ms for top-5 results | <50ms |
| **Dashboard Load** | ~1000ms for 30 tickets | <200ms |

---

## 🔧 Environment Variables - Some of the variables are required to run the application locally. I have listed them down here : 

```bash
QDRANT_URL=https://400bce25-f49d-416f-9c6b-64e88a72a355.eu-west-2-0.aws.cloud.qdrant.io
QDRANT_API_KEY=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
QDRANT_COLLECTION=atlan-web-docs-3
QDRANT_COLLECTION_2=Bulk_Tickets-2
QDRANT_COLLECTION_3=chat-history-with-llm-per-user

OPENAI_API_KEY=[Insert-your-api-key]
OPENAI_CHAT_MODEL=gpt-4
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
QDRANT_VECTOR_NAME=doc_dense_vector
QDRANT_TOP_K=3

PRIORITY_MODEL=valhalla/distilbart-mnli-12-1
SENTIMENT_EXACT_MODEL=facebook/bart-large-mnli
GENERAL_SENTIMENT_MODEL=michellejieli/emotion_text_classifier
KEYWORDS_MODEL=ilsilfverskiold/tech-keywords-extractor
TOPIC_MODEL=facebook/bart-large-mnli
```

---

## 🚀 Quick Start - Running Locally

### **Prerequisites**
- Python 3.8+ (3.9+ recommended)
- 4GB+ RAM (8GB+ recommended for optimal performance)
- 2GB+ free storage space

### **Environment Setup**

Create a `.env` file with your API keys:

```bash
OPENAI_API_KEY=your_openai_api_key
QDRANT_URL=your_qdrant_url
QDRANT_API_KEY=your_qdrant_api_key
...
Refer to the environment variables section above. 
```

### **Installation**

```bash
# Clone repository
git clone <https://github.com/anshuljethani/Customer-Support-Copilot-Atlan>

# Install dependencies
pip install -r requirements.txt

# If you encounter issues, try minimal installation:
# pip install -r requirements-exact.txt
```

### **Run the Application**

```bash
# Terminal 1 - Backend
cd backend && python app.py

# Terminal 2 - Frontend  
python -m http.server 8080

# Open http://localhost:8080
```

### **Troubleshooting**

| Issue | Solution |
|-------|----------|
| **Memory issues** | Use `requirements-minimal.txt` |
| **Port conflicts** | Kill processes with `lsof -ti:8080,8081 \| xargs kill -9` |
| **PyTorch issues** | Install CPU-only version |

---

## 📸 Project Screenshots

<img width="1489" height="859" alt="image" src="https://github.com/user-attachments/assets/61d76dfd-98aa-435e-8c33-35dc75c69e42" />

<img width="1489" height="859" alt="image" src="https://github.com/user-attachments/assets/47d7ab8c-f433-49b9-b3a4-e821b062f582" />

<img width="1489" height="859" alt="image" src="https://github.com/user-attachments/assets/8b98b84b-967b-4ddd-b16a-f955e8d76154" />

<img width="1497" height="861" alt="image" src="https://github.com/user-attachments/assets/fd07e11e-7220-4196-8b54-acb706b2d394" />

---

## 🎬 Project Demonstration

**Video Link**: {link}

**Deployed Project**: {link}

---

## 👥 Project Information

### **🎓 Developer Profile**
- **Name**: Anshul Ajay Jethani
- **Institution**: Pune Institute of Computer Technology
- **Department**: Information Technology

### **🛠️ Built With**

Built using cutting-edge AI/ML technologies:

| Technology | Purpose |
|------------|---------|
| **HuggingFace Transformers** | ML processing |
| **Qdrant** | Vector search capabilities |
| **Chart.js** | Beautiful visualizations |
| **Flask** | Robust backend services |

---

## 📞 Contact & Support

### **👨‍💻 Developer Contact**

| Contact | Details |
|---------|---------|
| 📧 **Email** | anshuljethani777@gmail.com |
| 💼 **LinkedIn** | [Anshul Jethani](https://www.linkedin.com/in/anshuljethani777/) |
| 📱 **Phone** | +91 8530920104 |

---

> **Final Note**: This project was developed as part of Atlan's AI Engineering Internship Challenge, demonstrating the power of modern AI/ML engineering with a focus on clean architecture, scalable design, and practical business applications.

---
