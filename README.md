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

{diagram}

{diagram}

### **Core Philosophy: The Power of Three**

This system is built on a fundamental architectural principle - **only 3 core API calls** handle the entire data processing pipeline:

{diagram}

> This elegant simplicity ensures maintainability, scalability, and performance while delivering enterprise-grade functionality.

---

## 🧠 Backend Architecture

{diagram}

### **1. ML Processing Pipeline**

The system employs **4 concurrent HuggingFace transformer models** for comprehensive ticket analysis:

- **Priority Classification** - Automatically determines ticket urgency from body
- **Sentiment Analysis** - Extracts customer emotional state from body and subject  
- **Topic Extraction** - Identifies key themes and categories from subject
- **Keyword Extraction** - Identifies keywords from body and subject

### **2. Services Layer (`/services/`)**

{diagram}

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

{diagram}

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

## 🔧 Environment Variables

```bash
QDRANT_URL=your_qdrant_endpoint
QDRANT_API_KEY=your_api_key
LLM_API_KEY=your_llm_key
FLASK_ENV=production
```

---

## 🚀 Quick Start - Running Locally

### **Prerequisites**
- Python 3.8+ (3.9+ recommended)
- 4GB+ RAM (8GB+ recommended for optimal performance)
- 2GB+ free storage space

### **Installation**

```bash
# Clone repository
git clone <your-repo-url>
cd Atlan-Final

# Install dependencies
pip install -r requirements.txt

# If you encounter issues, try minimal installation:
# pip install -r requirements-exact.txt
```

### **Environment Setup**

Create a `.env` file with your API keys:

```bash
OPENAI_API_KEY=your_openai_api_key
QDRANT_URL=your_qdrant_url
QDRANT_API_KEY=your_qdrant_api_key
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

{diagram}

{diagram}

{diagram}

{diagram}

---

## 🎬 Project Demonstration

**Video Link**: {link}

**Deployed Project**: {link}

---

## 👥 Project Information

### **🎓 Developer Profile**

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
| 💼 **LinkedIn** | [Anshul Jethani](https://linkedin.com/in/anshul-jethani) |
| 📱 **Phone** | +91 8530920104 |

---

> **Footer Note**: This project was developed as part of Atlan's AI Engineering Internship Challenge, demonstrating the power of modern AI/ML engineering with a focus on clean architecture, scalable design, and practical business applications.

---

⭐ **If you found this project helpful, please give it a star!** ⭐
