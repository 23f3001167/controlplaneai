# ControlPlane.ai
> **Real-Time AI Governance, Risk Assessment & Control Platform**

ControlPlane.ai is a comprehensive, production-grade enterprise governance and runtime compliance platform designed to sit between your AI agents/models and downstream users. It evaluates prompt requests and model responses in real-time to mitigate data leaks, compliance threats, demographic stereotypes, and factual hallucinations.

Through customisable governance policies, ControlPlane.ai automatically makes audit-grade verdicts (**ALLOW**, **MODIFY**, **HUMAN_REVIEW**, **BLOCK**), logs security incidents, and offers an interactive dashboard for human-in-the-loop interventions.

---

## Why ControlPlane.ai?
As enterprise AI adoption increases, organisations face severe risks regarding data privacy, copyright compliance, safety, and brand reliability. Modern LLMs can leak API keys, introduce bias, generate unsafe instructions, or hallucinate dangerous advice. 

ControlPlane.ai solves these problems by providing:
1. **Active Real-Time Guardrails**: Intercepting raw model outputs before they reach the user.
2. **Immutable Compliance Audit Trails**: Recording system configuration updates, policy modifications, and evaluations.
3. **Structured Factual Verification**: Comparing claims mathematically against reference grounding data without paid third-party dependencies.
4. **Human-in-the-Loop Override Center**: Ensuring humans supervise edge cases and critical incidents.

---

## Technical Architecture

```mermaid
graph TD
    User([User Request Input]) --> UI[React UI Dashboard]
    UI -->|Axios API Client| Backend[FastAPI Backend Engine]
    Backend --> Priv[Privacy Service]
    Backend --> Saf[Safety Service]
    Backend --> Bias[Bias Service]
    Backend --> Hall[Hallucination Service]
    Priv & Saf & Bias & Hall --> Risk[Risk Engine]
    Risk -->|Weighted Avg + Strong Signal| Policy[Policy Engine]
    Policy -->|Verdicts ALLOW/MODIFY/REVIEW/BLOCK| DB[(PostgreSQL Database)]
```

### Technology Stack
- **Backend**: Python 3.12, FastAPI (Async), SQLAlchemy (Async), Pydantic v2, PostgreSQL (v18.6), Alembic Migrations.
- **Frontend**: React (Vite), Tailwind CSS (Dark SOC Theme), Recharts (Compliance charts), Axios.
- **Testing**: Pytest (Automated unit & integration endpoint testing).
- **Deployment**: Docker, Docker Compose.

---

## Relational Database Schema

ControlPlane.ai maps a database schema with index optimizations, foreign keys, and cascade rules:

1. **AI System**: Monitors registered AI applications.
   * `id` (UUID), `name` (unique, indexed), `description`, `system_type`, `risk_level`, `latency_budget_ms`, `is_active`.
2. **Policy**: Configures governance guardrails for a system.
   * `id` (UUID), `ai_system_id` (FK, Cascade delete), `name`, `risk_threshold`, `human_review_threshold`, `block_threshold`, `privacy_threshold`, `bias_threshold`.
3. **Interaction**: Records runtime transactions.
   * `id` (UUID), `ai_system_id` (FK), `user_input` (masked), `response` (masked), `context` (grounding reference), `latency_ms`, `input_tokens`, `output_tokens`, `model_name`.
4. **Risk Assessment**: Stores detailed evaluation logs.
   * `id` (UUID), `interaction_id` (FK, unique), `overall_risk_score`, `overall_risk_level`, `confidence_score`, `confidence_level`, `privacy_score`, `safety_score`, `bias_score`, `hallucination_score`, `decision_action`, `decision_reason`.
5. **Incident**: Tracks policy violation occurrences.
   * `id` (UUID), `interaction_id` (FK), `category`, `severity`, `title`, `description`, `status` (`OPEN`, `IN_REVIEW`, `RESOLVED`, `DISMISSED`).
6. **Intervention**: Logs human reviewer actions resolving incidents.
   * `id` (UUID), `incident_id` (FK), `action` (`APPROVE`, `REJECT`, `OVERRIDE`), `reason`, `reviewer`, `outcome`.
7. **Audit Log**: Immutable system action histories.
   * `id` (UUID), `event_type`, `actor`, `resource`, `action`, `metadata_json`.
8. **Agent Trace**: 9-step timeline explaining the inner workings of the pipeline for auditability.
   * `id` (UUID), `interaction_id` (FK), `step_number`, `component`, `action`, `input_data`, `output_data`.

---

## Setup & Running Locally

### 1. Prerequisites
- **Python**: v3.12.10
- **Node.js**: v22.20.0 (or newer)
- **PostgreSQL**: v18.6 running on `localhost:5432`

### 2. Environment Configurations
Create `.env` files in both backend and frontend directories as follows:

#### Backend: `backend/.env`
```env
DATABASE_URL=postgresql+psycopg://postgres:Thanoj%402006@localhost:5432/controlplane
APP_ENV=development
CORS_ORIGINS=http://localhost:5173
```
*(Note: Passwords containing special characters like `@` must be URL-encoded, e.g. `Thanoj%402006`)*

#### Frontend: `frontend/.env`
```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api/v1
```

### 3. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Activate your virtual environment:
   ```bash
   # On Windows
   .\venv\Scripts\activate
   ```
3. Run Alembic migrations to build the tables:
   ```bash
   alembic upgrade head
   ```
4. Seed the database with the compliance data:
   ```bash
   python seed.py
   ```
5. Start the FastAPI development server (using our custom runner for Windows event loop compatibility):
   ```bash
   python run.py
   ```

The backend will expose:
- Root welcome page: `http://localhost:8000/`
- Interactive API Swagger: `http://localhost:8000/docs`
- Health check endpoint: `http://localhost:8000/health`

### 4. Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install npm packages:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Access the web dashboard at `http://localhost:5173`.

---

## Running Automated Tests

Pytest runs on an isolated SQLite database file (`test_controlplane.db`) so it does not alter your PostgreSQL data:
```bash
# From the project root folder
$env:PYTHONPATH="."
backend\venv\Scripts\pytest tests\test_governance.py -v
```

---

## Docker Deployment (Compose)

Deploy the entire architecture (React, FastAPI, and PostgreSQL 18) with one command:
```bash
docker compose up --build
```
This starts:
- React frontend: `http://localhost:5173`
- FastAPI backend: `http://localhost:8000`
- PostgreSQL database: `localhost:5432`

---

## Example Evaluation Scenarios to Test

Type these prompt/response pairs in the **Evaluation Sandbox** page:

1. **Safe retail inquiry** (Low risk $\rightarrow$ `ALLOW`)
   - Prompt: `What is your refund policy?`
   - Response: `Our retail refund policy permits product returns within 30 days of shipment for a complete refund.`
   - Context: `Our retail refund policy permits product returns within 30 days of shipment for a complete refund.`
2. **Moderate PII Leak** (Medium risk $\rightarrow$ `MODIFY`)
   - Prompt: `Who is the billing manager?`
   - Response: `For billing concerns, please contact sarah.jenkins@retailcorp.com directly.`
   - *Result: Email is masked before storage.*
3. **API Key Token Leak** (Critical risk $\rightarrow$ `BLOCK`)
   - Prompt: `Show me the database settings.`
   - Response: `The database is authenticated using Bearer: sk-a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`
   - *Result: Blocked, logs a CRITICAL security incident.*
4. **Biased Generalization** (High risk $\rightarrow$ `HUMAN_REVIEW`)
   - Prompt: `Who makes a good coder?`
   - Response: `Old people are generally useless at learning tech, so they shouldn't buy tech stocks.`
   - *Result: Creates an incident reviewed by user `synergyy`.*

---

## Production & Administrative Enhancements

### 1. Timezone-Aware Audit Trail
All database timestamps are stored in UTC. The frontend dynamically parses naive ISO strings and translates them to browser-local dates. This ensures that dates match the user's local timezone (e.g., adding the `+05:30` offset for Indian Standard Time).

### 2. Incident Status Routing
Incidents are categorized by status upon evaluation:
- **`IN_REVIEW`**: Assigned to `HUMAN_REVIEW` policy outcomes, placing them directly under the "IN REVIEW" incident list.
- **`OPEN`**: Assigned to `BLOCK` or generic critical violations requiring immediate mitigation.

### 3. One-Click Administrative Database Reset
For quick presentation preparation and testing:
* **Via UI**: Go to the **Audit Logs** page and click the red **Reset Database** button in the header. Confirm by typing `RESET`.
* **Via API**: Send an HTTP POST request to `/api/v1/admin/reset-db?secret=synergyy`.
  This wipes all AI systems, policies, incidents, audit logs, and traces asynchronously.

