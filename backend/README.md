# setrsoft Backend

Django REST API for setrsoft. Uses PostgreSQL and is configured via environment variables.

## Prerequisites

- Python 3.11 or 3.12
- PostgreSQL (running locally or in Docker)

## Install dependencies

From the repository root:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

## Environment variables

Use the **repository root** template and file:

```bash
# From the repository root (not inside backend/)
cp .env.example .env
```

Variable names and descriptions live in **`/.env.example`**. Django loads **`/.env`** via `setrsoft/settings.py` (`REPO_ROOT / '.env'`).

## Database

Ensure PostgreSQL is running and the database exists (create it if needed). Then run migrations:

```bash
cd backend
python manage.py migrate
```

## Run the server

```bash
cd backend
python manage.py runserver
```

The API will be available at `http://localhost:8000/`. Health check: `http://localhost:8000/api/health/` (returns `{"status": "ok"}`).

## Docker (optional)

From the repository root, ensure **`.env`** exists (copy from `.env.example`). Docker Compose sets `POSTGRES_HOST=db` inside the backend container; keep `POSTGRES_HOST=localhost` in `.env` for running Django on the host against a local PostgreSQL instance.

Start both the database and the backend:

```bash
docker compose up -d
```

- Database: port `5432`
- Backend API: `http://localhost:8000/`, health check: `http://localhost:8000/api/health/`

To run migrations inside the container:

```bash
docker compose exec backend python manage.py migrate
```
