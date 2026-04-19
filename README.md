# 🤖 AI Database Helper

An AI-powered chatbot that allows non-technical users (sales, marketing, business teams) to query databases using natural language. The system converts user queries into safe SQL using an LLM with tool-calling capabilities.

---

## 🚀 Features

* **Natural Language → SQL conversion**: Speak to your database in plain English.
* **Tool-based AI Agent**: The LLM autonomously decides when to check the schema or execute a query.
* **Schema-aware querying**: Dynamically fetches schema to ensure accurate, hallucination-free queries.
* **Safe SQL execution**: Strictly enforces `SELECT`-only execution to prevent data mutation.
* **Chat History & Context**: Maintains a persistent conversation history so the AI remembers your previous questions and answers.
* **Minimal & Professional UI**: A clean, modern chat interface designed for the best user experience.
* **Local Storage Configurations**: Database credentials and connection settings are securely saved to your browser's local storage so you don't need to re-enter them.

---

## 🧠 System Overview

This project implements a **tool-using AI agent** with two core tools:

1. `get_schema` → Fetch database schema
2. `get_data` → Execute SQL queries safely

---

## 🏗️ Architecture

```
Frontend (React + Vite + TypeScript)
        ↓
Backend (Node.js + Express + TypeScript)
        ↓
LLM (Groq API)
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
├── backend/                  # Node.js backend using Express & TypeScript
│   ├── src/
│   │   ├── controllers/      # Route handlers
│   │   ├── services/         # Core business logic (Agent, DB, Schema, LLM)
│   │   ├── tools/            # AI Agent Tools
│   │   ├── utils/            # Utilities (SQL formatters, validators)
│   │   ├── types/            # TypeScript type definitions
│   │   └── server.ts         # Server entry point
│   ├── scripts/              # DB seeding scripts
│   └── package.json
│
├── frontend/                 # React frontend using Vite
│   ├── src/
│   │   ├── components/       # UI Components (Chat, Sidebar, InputBox, Message)
│   │   ├── pages/            # Page layouts
│   │   ├── hooks/            # Custom React hooks
│   │   ├── api/              # Backend API integration layer
│   │   ├── styles.css        # Minimal & professional modern UI styling
│   │   └── main.tsx          # Application entry point
│   └── package.json
│
└── README.md
```

---

## ⚙️ Backend Details

### 🔹 Agent Flow

1. User sends query along with chat history.
2. LLM evaluates context and decides:
   * Needs schema? → call `get_schema`
   * Ready for query? → call `get_data`
3. Backend executes tool against the user's database.
4. LLM parses tool results and generates a final formatted response.

---

### 🔹 Tool: get_schema

**Purpose:** Fetch database schema dynamically

**Input:**
```json
{
  "table": "optional_table_name"
}
```

---

### 🔹 Tool: get_data

**Purpose:** Execute SQL queries safely

**Input:**
```json
{
  "query": "SELECT * FROM sales LIMIT 10"
}
```

---

### 🔐 SQL Safety Rules

* Only allow `SELECT` statements.
* Block: `INSERT`, `UPDATE`, `DELETE`, `DROP`, `ALTER`, `TRUNCATE`.
* Enforces `LIMIT` clauses to prevent massive data dumps.

---

## 🎨 Frontend Details

### Tech Stack

* React (via Vite)
* TypeScript
* Vanilla CSS with modern UI variables and Google Fonts (Inter)

### Core Components

* **Chat** → Main conversation UI with distinct user and assistant bubbles.
* **Message** → Renders individual chat blocks safely.
* **InputBox** → Sleek user input mechanism.
* **Sidebar** → Manages dynamic database configuration variables synced with LocalStorage.

---

## 🔌 API Design

### POST `/chat`

**Request Body:**
```json
{
  "message": "How much sales today?",
  "dbConfig": {
    "host": "localhost",
    "port": 5432,
    "user": "postgres",
    "password": "password",
    "database": "postgres",
    "ssl": false
  },
  "history": [
    { "role": "user", "content": "What tables do I have?" },
    { "role": "assistant", "content": "You have a sales table." }
  ]
}
```

---

## ⚡ Setup Instructions

### 1. Clone repo

```bash
git clone <repo-url>
```

### 2. Backend setup

```bash
cd backend
pnpm install
pnpm run dev
```

### 3. Frontend setup

```bash
cd frontend
pnpm install
pnpm run dev
```

---

## 🔥 Future Improvements

* Charts & data visualizations
* Multi-database support (MySQL, SQL Server, etc.)
* Authentication and session management
* Role-based access control
* Voice input
* Downloadable query reports (CSV/PDF)

---

## 🤝 Contribution

PRs are welcome. Please ensure your code is modular, well-typed with TypeScript, and follows the existing design patterns.

---

## 📜 License

MIT License

---

## 🚀 Final Note

This project demonstrates a real-world AI system where LLMs interact with structured data safely and intelligently, providing actionable insights directly to non-technical end-users.
