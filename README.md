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
-   **Backend**: Django Rest Framework (DRF), SimpleJWT.
-   **Database**: SQLite (Development) / PostgreSQL (Production ready).

## Getting Started

### Prerequisites

-   Python 3.8+
-   Node.js 18+

### Backend Setup

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
4.  Run migrations:
    ```bash
    python manage.py migrate
    ```
5.  Start the server:
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
