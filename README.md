# SwasthyaNetram - Hospital Management System & AI-Assisted EHR

SwasthyaNetram (meaning "Health Vision") is a state-of-the-art Electronic Health Record (EHR) and Hospital Management System designed to streamline modern healthcare operations. By combining traditional EHR capability with advanced AI, it offers robust multi-hospital administration, dynamic clinical notes, and AI-driven clinical assistants powered by **Google Gemini** and **LangGraph**.

---

## 🏗️ System Architecture

The following diagram illustrates how the Next.js frontend, Django REST API backend, PostgreSQL database, and Google Gemini AI services interact:

```mermaid
graph TD
    %% User/Client Tier
    User((Clinician / Staff)) -->|Interacts with UI| FE[Next.js 15 App Router]
    
    %% Frontend to Backend
    FE -->|HTTPS REST API / JSON| BE[Django REST Framework]
    FE -->|Secure Token Auth| Auth[SimpleJWT Authentication]

    %% Backend Components
    subgraph Django Backend
        BE --> Controllers[Views / ViewSets]
        Controllers --> ORM[Django Models / ORM]
        
        %% OCR Background pipeline
        Controllers -->|Background Thread| OCR[OCR / Prescription Parser]
        
        %% LangGraph Agentic Pipeline
        Controllers -->|Session Chat| Agent[Swasthya AI Agent - LangGraph]
    end

    %% Database Tier
    subgraph Data Layer
        ORM -->|SQL Queries| DB[(PostgreSQL / SQLite)]
        DB -->|Retrieve Embeddings| SemanticSearch[Vector Cosine Similarity - NumPy]
    end

    %% Google AI Tier
    subgraph Google Gemini APIs
        OCR -->|Image Upload + Prompt| GeminiOCR[gemini-2.5-flash-lite]
        Agent -->|Stateful Message Graph| GeminiChat[gemini-2.5-flash-lite / gemini-2.5-flash]
        Agent -->|Semantic Text Embeddings| GeminiEmbed[text-embedding-004]
    end
    
    %% Data Flow
    GeminiOCR -->|Structured JSON Array| OCR
    OCR -->|Extract Medicines| ORM
    
    GeminiEmbed -->|Vector Embeddings| SemanticSearch
    SemanticSearch -->|Semantic Matches| Agent
```

---

## 🌟 Core Features

- 🏢 **Multi-Hospital Administration**: Administer multiple hospital branches, departments, rooms, and personnel configurations under a unified web console.
- 📂 **Advanced Patient EHR**: Capture full demographic information, contact details, dynamic meal timings, allergies, and ongoing symptoms.
- 📝 **Dynamic SOAP Notes**: Clinical notes structured by Subjective, Objective, Assessment, and Plan fields, linked directly to the attending physician.
- 📑 **Lab Report Text Extraction**: Auto-extract text from uploaded PDFs, plain-text files, or CSVs. This automatically invalidates existing embeddings, triggering an auto-re-embed for the patient vector.
- 💊 **AI Prescription OCR Scanner**: Upload prescription images and automatically parse them into structured, searchable database tables (`Medicine` model) using Gemini Vision models with automatic rate-limit retries and model fallbacks.
- 🤖 **Swasthya AI Clinical Assistant**: A stateful conversational agent built using LangGraph. The agent can execute semantic search across medical records (RAG), search patients by name, lookup upcoming appointments, and update medical histories dynamically.
- 🌗 **Vibrant, Responsive UI**: Built with Next.js 15, Tailwind CSS v4, Lucide Icons, and full Light/Dark mode toggling.

---

## 📂 Project Directory Structure

```text
SwasthyaNetram/
├── docker-compose.yml       # Containerized PostgreSQL database mapping to port 5433
├── backend/                 # Django REST Framework Backend
│   ├── swasthya_backend/    # Main project configurations and routing
│   ├── ai_chat/             # LangGraph agent, tool implementations, and RAG utilities
│   ├── patients/            # EHR models, signals, and background OCR tasks
│   ├── hospitals/           # Hospital branch, rooms, and stats
│   ├── employees/           # Doctor, Nurse, and staff management
│   ├── appointments/        # Clinic scheduling system
│   ├── users/               # Authentication APIs & profiles
│   ├── check_db.py          # Database connectivity check script
│   └── requirements.txt     # Python dependencies
└── frontend/                # Next.js 15 Frontend
    ├── app/                 # Next.js App Router (dashboard, ai-assistant, auth)
    ├── components/          # Reusable Tailwind UI components
    ├── context/             # React context (Auth context, theme support)
    └── tailwind.config.js   # Style config
```

---

## 🗄️ Database Design & Schema

The backend utilizes Django’s ORM to map relationship structures. Below are the primary models:

### 1. `Hospital` & `Room`
- **Hospital**: Tracks the location, contact details, and metadata of hospital branches.
- **Room**: Represents rooms/beds. Types include `General Ward`, `Semi-Private`, `Private`, and `ICU`. Holds a unique One-to-One link to a `Patient` (occupied status).

### 2. `Employee`
- Tracks doctors, nurses, receptionists, pharmacists, and admins. Relates to a `Hospital` branch. Doctors are linked to appointments.

### 3. `Patient`
- Holds demographic details, allergies, symptoms, medical history, and dynamic meal times (`breakfast_time`, `lunch_time`, `dinner_time`).
- **`embedding_json`**: Caches the 768-dimension vector representation calculated from the patient's text chunk via the `text-embedding-004` model.

### 4. `LabReport`
- Stores lab PDFs or text reports. A `post_save` trigger extracts text, updates `extracted_text`, and clears the parent patient's `embedding_json` to force RAG cache updates on next search.

### 5. `SOAPNote`
- Captures subjective complaints, objective exam results, assessment, and treatment plans authored by a specific physician.

### 6. `Prescription` & `Medicine`
- **Prescription**: Uploads handwritten/typed prescription images. The upload triggers a background thread that invokes Gemini Vision to extract medicines.
- **Medicine**: Structure extracted from the OCR containing: name, dosage, frequency, duration, timing (`morning`, `afternoon`, `night`, `any`), and instructions (e.g. "Take after meals").

---

## ⚙️ Environment Configuration

Create a `.env` file in the `backend/` directory based on the `.env.example` template:

| Environment Variable | Description | Example / Recommended Value |
| :--- | :--- | :--- |
| `SECRET_KEY` | Django project secret key | Any secure random string |
| `DEBUG` | Enables/disables development debug mode | `True` (Development) / `False` (Production) |
| `ALLOWED_HOSTS` | Whitelisted hosts | `localhost,127.0.0.1` |
| `GEMINI_API_KEY` | Google AI Studio key for agent and OCR | Get yours from [Google AI Studio](https://aistudio.google.com/) |
| `GEMINI_MODEL` | Embedding / Chat generation model override | `gemini-2.5-flash-lite` |
| `DATABASE_URL` | PostgreSQL connection string | *See Database Options below* |
| `LANGCHAIN_TRACING_V2` | Enables LangSmith monitoring for agent | `true` / `false` |
| `LANGCHAIN_API_KEY` | LangSmith Monitoring API key | Get yours from [LangSmith](https://smith.langchain.com/) |

### Database Options (`DATABASE_URL` configurations):
* **Option A (Docker Compose - Recommended)**: `postgres://postgres:postgres@localhost:5433/swasthya_db`
* **Option B (Local Postgres System)**: `postgres://username:password@localhost:5432/db_name`
* **Option C (Supabase Cloud Database)**: `postgres://postgres.xxxxxx:password@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require`
* **Option D (SQLite fallback)**: Leave `DATABASE_URL` empty or comment it out.

---

## 🚀 Step-by-Step Installation Guide

### Prerequisites
- Python 3.10+
- Node.js 18+
- Docker Desktop (for containerized DB setup)

---

### Step 1: Database Setup

#### Option A: Running via Docker (Recommended)
1. Run this command from the project root:
   ```bash
   docker compose up -d
   ```
2. Verify the container is active and mapped to port `5433`:
   ```bash
   docker compose ps
   ```

#### Option B: Creating a Database Locally
1. Log into your PostgreSQL instance (`psql`):
   ```sql
   CREATE DATABASE swasthya_db;
   ```

---

### Step 2: Backend Setup
1. Open a terminal and navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   # Windows
   python -m venv venv
   venv\Scripts\activate

   # macOS/Linux
   python3 -m venv venv
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure environment files:
   ```bash
   cp .env.example .env
   ```
   *Make sure to configure your `DATABASE_URL` and `GEMINI_API_KEY` in the newly created `.env` file.*
5. Run the database diagnostic script to verify connection:
   ```bash
   python check_db.py
   ```
6. Run database migrations:
   ```bash
   python manage.py migrate
   ```
7. Create a superuser:
   ```bash
   python create_superuser.py
   ```
8. Start the Django API Server:
   ```bash
   python manage.py runserver 8080
   ```
   *The API will run at `http://127.0.0.1:8080/`.*

---

### Step 3: Frontend Setup
1. Open a new terminal and navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Run the Next.js development server:
   ```bash
   npm run dev
   ```
   *Open [http://localhost:3000](http://localhost:3000) in your web browser.*

---

## 📡 API Endpoints Reference

### 🔐 Authentication (`/api/auth/`)
- `POST /api/auth/register/` - Register a new account.
- `POST /api/auth/login/` - Login and obtain JWT access + refresh tokens.
- `POST /api/auth/refresh/` - Refresh expired access tokens.
- `POST /api/auth/change-password/` - Update user passwords (requires Auth).
- `GET /api/auth/profile/` - Fetch profile details of the authenticated user.

### 🏥 Hospital Management (`/api/`)
- `GET/POST /api/hospitals/` - Fetch all hospital branches or create a new branch.
- `GET/POST /api/rooms/` - Fetch room listings and view bed occupancy statuses.
- `GET /api/dashboard/stats/` - Retrieve real-time dashboard summary stats (counts of patients, doctors, appointments, rooms).

### 👥 Employees (`/api/employees/`)
- `GET/POST /api/employees/` - View all personnel (Doctors, Nurses, Pharmacists, Admins) and assign roles.

### 🩺 EHR / Patients (`/api/patients/`)
- `GET/POST /api/patients/` - Fetch patient lists or register new patients.
- `GET/POST /api/patients/reports/` - View lab report listings or upload documents (PDF/TXT/CSV).
- `GET/POST /api/patients/notes/` - View or compose medical SOAP notes.
- `GET/POST /api/patients/prescriptions/` - Upload prescriptions. Uploading kicks off the background AI OCR parser.
- `GET/POST /api/patients/medicines/` - Fetch medicines currently assigned to patients.

### 📅 Appointments (`/api/appointments/`)
- `GET/POST /api/appointments/` - Schedule appointments, view doctor-patient listings, and change schedules.

### 🤖 AI Agent (`/api/ai/`)
- `POST /api/ai/chat/` - Send a text query to the LangGraph assistant. Requires JSON:
  ```json
  {
    "message": "Who are the patients suffering from diabetes?",
    "hospital_id": 1,
    "session_id": 4
  }
  ```
- `GET/POST /api/ai/sessions/` - Retrieve chat history sessions or create new conversational channels.

---

## 🛠️ Diagnostics & Utility Scripts

Inside the `backend/` directory, several helper scripts are available:
- **`check_db.py`**: Checks credentials, hostname routing, and validates connection to the PostgreSQL database.
- **`create_superuser.py`**: Interactively creates a default administrative account.
- **`list_gemini_models.py`**: Lists all available generative models connected to your API key.
- **`test_prescription_ocr.py`**: Tests the background prescription OCR workflow directly using local prescription images.
- **`test_rag.py`**: Tests RAG embedding calculations and cosine similarity functionality.

---

## 📄 License
This project is licensed under the MIT License - see the LICENSE file for details.
