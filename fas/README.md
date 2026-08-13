# Factory Automation Software (FAS)

FAS is a full-stack web application for factory operations that combines:
1. A relational database modeling machines, production, and predictive maintenance.
2. A real-time dashboard.
3. An AI agent (local LLM via Ollama) that predicts problems and answers natural-language questions.

This project includes a **Digital Twin Simulator** that runs in the backend. It continuously writes realistic simulated data into the database (sensor readings, production runs, defects, downtime), mimicking real hardware. This is standard practice when prototyping IIoT software.

## Prerequisites

1. **Node.js** (v18+)
2. **Python 3** (v3.10+)
3. **PostgreSQL**
4. **Ollama**

## Setup Instructions

### 1. Database Setup
1. Ensure PostgreSQL is installed and running on default port `5432`.
2. By default, the backend expects a user `postgres` with password `postgres` and a database named `fas`. 
   *You can override these in `backend/.env` if your local setup is different.*
3. Create the database if it doesn't exist:
   ```bash
   psql -U postgres -c "CREATE DATABASE fas;"
   ```

### 2. Ollama Setup
1. Install [Ollama](https://ollama.ai).
2. Pull the required model:
   ```bash
   ollama run llama3.1:8b
   ```

### 3. Backend Setup
1. Open a terminal and navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment (if not already done):
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On Mac/Linux:
   source venv/bin/activate
   ```
3. Install requirements:
   ```bash
   pip install -r requirements.txt
   ```
4. **Seed the Database (One-time):**
   ```bash
   python src/db/seed.py
   ```
5. Start the backend API:
   ```bash
   python src/main.py
   ```

### 4. Frontend Setup
1. Open a new terminal and navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```

## Using the System

- Navigate to `http://localhost:5173`.
- Go to the **Overview** page and click the **Start** button in the top right to start the digital twin simulator.
- The simulator will begin generating live data.
- In the **Machines** page, you can select a machine and see its live sensor readings. You can click **Inject Failure (Drift)** to simulate a degradation over time, leading to an automated downtime event.
- Check the **AI Agent** page to chat with the factory data in natural language (e.g., "Which machine is down right now?", "Show me the recent defects").

