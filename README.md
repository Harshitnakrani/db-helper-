# 🤖 AI Database Helper

An AI-powered chatbot that allows non-technical users (sales, marketing, business teams) to query databases using natural language. The system converts user queries into safe SQL using an LLM with tool-calling capabilities.

---

## 🚀 Features

* Natural Language → SQL conversion
* Tool-based AI Agent (NOT simple prompt-based)
* Schema-aware querying (no hallucination)
* Safe SQL execution (SELECT-only enforcement)
* Chat-based UI
* Dynamic schema exploration
* Clean formatted responses

---

## 🧠 System Overview

This project implements a **tool-using AI agent** with two core tools:

1. `get_schema` → Fetch database schema
2. `get_data` → Execute SQL queries safely

---

## 🏗️ Architecture

```
Frontend (React + Vite)
        ↓
Backend (Node.js / TypeScript)
        ↓
LLM (Groq)
        ↓
Tool Layer
   ├── get_schema
   └── get_data
        ↓
Database (PostgreSQL)
```

---

## 📂 Project Structure

```
zenity db helper/
│
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   └── chat.controller.ts
│   │   ├── services/
│   │   │   ├── agent.service.ts
│   │   │   ├── db.service.ts
│   │   │   ├── schema.service.ts
│   │   │   └── llm.service.ts
│   │   ├── tools/
│   │   │   ├── getSchema.ts
│   │   │   └── getData.ts
│   │   ├── utils/
│   │   │   ├── sqlValidator.ts
│   │   │   └── formatter.ts
│   │   ├── config/
│   │   │   └── db.config.ts
│   │   ├── types/
│   │   │   └── tool.types.ts
│   │   └── app.ts
│   │
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Chat.tsx
│   │   │   ├── Message.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── InputBox.tsx
│   │   ├── pages/
│   │   │   └── Home.tsx
│   │   ├── hooks/
│   │   │   └── useChat.ts
│   │   ├── api/
│   │   │   └── chat.ts
│   │   └── main.tsx
│   │
│   └── package.json
│
└── README.md
```

---

## ⚙️ Backend Details

### 🔹 Agent Flow

1. User sends query
2. LLM decides:

   * Needs schema? → call `get_schema`
   * Ready for query? → call `get_data`
3. Backend executes tool
4. LLM generates final response

---

### 🔹 Tool: get_schema

**Purpose:** Fetch database schema dynamically

**Input:**

```
{
  "table": "optional"
}
```

**Output:**

```
{
  "tables": ["sales", "customers"]
}
```

OR

```
{
  "columns": [
    { "name": "id", "type": "int" },
    { "name": "amount", "type": "numeric" }
  ]
}
```

---

### 🔹 Tool: get_data

**Purpose:** Execute SQL queries safely

**Input:**

```
{
  "query": "SELECT * FROM sales LIMIT 10"
}
```

**Output:**

```
{
  "rows": [...]
}
```

---

### 🔐 SQL Safety Rules

* Only allow `SELECT`
* Block:

  * INSERT
  * UPDATE
  * DELETE
  * DROP
* Enforce `LIMIT 100`

---

### 🗄️ Schema Extraction Queries

**Tables:**

```sql
SELECT table_name FROM information_schema.tables WHERE table_schema='public';
```

**Columns:**

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name='your_table';
```

---

## 🎨 Frontend Details

### Tech Stack

* React (Vite)
* TypeScript

---

### UI Layout

```
-----------------------------------
| Sidebar | Chat Area             |
|---------|-----------------------|
| Tables  | User Input            |
| History | AI Responses          |
-----------------------------------
```

---

### Core Components

* Chat → Main conversation UI
* Message → Individual messages
* InputBox → User input
* Sidebar → Tables / history

---

## 🔌 API Design

### POST /chat

**Request:**

```
{
  "message": "How much sales today?"
}
```

**Response:**

```
{
  "reply": "Total sales today is ₹1,20,000"
}
```

---

## 🧠 LLM Integration

* Use Groq
* Tool calling enabled
* System prompt defines behavior

---

## ⚡ Setup Instructions

### 1. Clone repo

```
git clone <repo-url>
```

### 2. Backend setup

```
cd backend
npm install
npm run dev
```

### 3. Frontend setup

```
cd frontend
npm install
npm run dev
```

---

## 🔥 Future Improvements

* Charts & visualizations
* Multi-database support
* Authentication
* Query history
* Role-based access
* Voice input

---

## 💣 Key Learning Concepts

* AI Agents
* Tool Calling
* RAG-like schema retrieval
* SQL safety enforcement
* System prompt engineering

---

## 🤝 Contribution

PRs are welcome. Keep code clean and modular.

---

## 📜 License

MIT License

---

## 🚀 Final Note

This project demonstrates a real-world AI system where LLMs interact with structured data safely and intell
