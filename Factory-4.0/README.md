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
4. If you want the simplest local demo, the project also runs with SQLite by default and will automatically create the needed tables when the backend starts.

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
4. Copy the sample env file and set the real values if needed:
   ```bash
   copy .env.example .env
   ```
5. Start the backend API:
   ```bash
   uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload
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
   npm run dev -- --host 0.0.0.0 --port 5173
   ```
4. Open the app in the browser:
   ```text
   http://localhost:5173/face-auth
   ```

## Face Authentication and Role-Based Access

The application is designed for a secure, role-aware factory workflow:

- Operator: Overview, Machines, Inventory
- Manager: Overview, Machines, Inventory, Quality, Production, Employees, Login History
- Admin: Overview, Machines, Inventory, Quality, Production, AI Agent, Employees, Login History

Face authentication is the security gate for the system:

1. Open the face-auth page.
2. Allow browser camera access from localhost.
3. Capture a face image.
4. Choose the user role.
5. Click Register Face (and auto-login) or Login with Face.
6. After successful verification, the app redirects the user to the dashboard for that role.

The backend validates the face image, creates a JWT token, and returns the user payload so the frontend can redirect to the correct dashboard automatically.

## Deployment

### Local development
Use this flow for a full local setup:

```bash
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload
```

In a second terminal:

```bash
cd frontend
npm install
npm run dev -- --host 0.0.0.0 --port 5173
```

### Docker
A Docker Compose stack is included for Postgres + backend + frontend + Ollama. Use it on a machine with Docker enabled:

```bash
docker compose up --build
```

Then open:

```text
http://localhost:5173/face-auth
```

## Using the System

- Navigate to the face-auth page and register or log in.
- The dashboard loads according to the authenticated role.
- Managers and admins can manage employees and review login history.
- The simulator can be started from the overview dashboard to generate live machine, inventory, and alert data.
- Use the AI Agent page for natural-language support and monitoring.

