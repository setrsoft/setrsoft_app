# SetterSoft Backend

Django REST API for SetterSoft. Uses PostgreSQL and is configured via environment variables.

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

Copy the example file and set your values:

```bash
cp .env.example .env
```

| Variable | Description |
|----------|-------------|
| `SECRET_KEY` | Django secret key (required in production). |
| `DEBUG` | Set to `True` for development, `False` in production. |
| `ALLOWED_HOSTS` | Comma-separated list of allowed hosts (e.g. `localhost,127.0.0.1`). |
| `POSTGRES_DB` | PostgreSQL database name. |
| `POSTGRES_USER` | PostgreSQL user. |
| `POSTGRES_PASSWORD` | PostgreSQL password. |
| `POSTGRES_HOST` | PostgreSQL host (`localhost` when running locally, `db` when using Docker). |
| `POSTGRES_PORT` | PostgreSQL port (default `5432`). |

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

From the repository root, ensure `backend/.env` exists (copy from `backend/.env.example` and set `POSTGRES_HOST=db` for the backend service, or use the defaults which point to the `db` service).

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
