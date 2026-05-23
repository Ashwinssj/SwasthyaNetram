# SwasthyaNetram - Hospital Management System

SwasthyaNetram is a comprehensive Electronic Health Record (EHR) and Hospital Management System designed to streamline healthcare operations. It features a modern, responsive dashboard for managing patients, employees, and hospital resources.

## Features

-   **Multi-Hospital Support**: Manage multiple hospital branches from a single admin interface.
-   **Patient Management**: Add, view, and search patient records with detailed profiles.
-   **Employee Management**: Manage doctors, nurses, and staff with role-based access.
-   **Authentication**: Secure JWT-based login and signup system.
-   **Dashboard**: Interactive dashboard with real-time statistics.
-   **Dark Mode**: Fully supported dark/light theme toggle.
-   **Settings**: User profile management, password changes, and notification preferences.

## Tech Stack

-   **Frontend**: Next.js 15 (App Router), Tailwind CSS v4, Lucide Icons.
-   **Backend**: Django Rest Framework (DRF), SimpleJWT, Psycopg2.
-   **Database**: SQLite (Fallback) / PostgreSQL (Local & Production compatible).

## Getting Started

### Prerequisites

-   Python 3.8+
-   Node.js 18+
-   Docker Desktop (Optional, but highly recommended for local database setup)

### 1. Database Setup

You can set up a local PostgreSQL database in one of two ways:

#### Option A: Using Docker Compose (Recommended)
This spins up PostgreSQL containerized, pre-configured with default credentials and a persistent data volume.

1. Start the database service from the project root:
   ```bash
   docker compose up -d
   ```
2. Verify the container is running:
   ```bash
   docker compose ps
   ```

#### Option B: Native Installation
If you already have PostgreSQL installed directly on your machine:
1. Open your PostgreSQL CLI (`psql`) or pgAdmin and run:
   ```sql
   CREATE DATABASE swasthya_db;
   ```

### 2. Environment Configuration

1. Navigate to the `backend` directory.
2. Copy the environment template:
   ```bash
   cp .env.example .env
   ```
3. Open `backend/.env` and review the database settings:
   - For **Docker Setup**, the default `DATABASE_URL` is already configured:
     `DATABASE_URL=postgres://postgres:postgres@localhost:5432/swasthya_db`
   - For **Native Setup**, uncomment Option B and update the string with your username and password:
     `DATABASE_URL=postgres://your_username:your_password@localhost:5432/swasthya_db`
   - For **Supabase**, uncomment Option C and add your Supabase connection URL.

4. Add your Gemini API Key to `GEMINI_API_KEY` for AI Chat features.

### 3. Connection Diagnostics

Verify that your Django application can successfully reach the database by running our database health check script:
```bash
python backend/check_db.py
```
This script will output connection parameters and diagnose issues if the server is offline or authentication fails.

### 4. Backend Setup

1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```
2.  Create a virtual environment:
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    ```
3.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
4.  Run migrations to build the tables:
    ```bash
    python manage.py migrate
    ```
5.  Create a default admin user:
    ```bash
    python create_superuser.py
    ```
6.  Start the development server:
    ```bash
    python manage.py runserver
    ```

### Frontend Setup

1.  Navigate to the frontend directory:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the development server:
    ```bash
    npm run dev
    ```

## License

This project is licensed under the MIT License.
