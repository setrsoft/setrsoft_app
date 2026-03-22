# SetterSoft

Monorepo: **Django** API (`backend/`), **React + Vite** app (`frontend/`), **PostgreSQL**.

## Environment variables

All variables are listed in **`.env.example`** at the repository root. Before running Docker Compose, copy it once:

```bash
cp .env.example .env
```

Compose loads **`.env`** automatically for `${VAR}` substitution in the YAML files, and each service uses **`env_file: .env`** so containers receive the same values. Django reads the same **`.env`** from the repo root when you run `manage.py` locally (see `backend/setrsoft/settings.py`).

## Development (Docker)

From the repository root (after `cp .env.example .env`):

```bash
docker compose up
```

This starts:

| Service   | Role                         | URL / port        |
| --------- | ---------------------------- | ----------------- |
| `db`      | PostgreSQL                   | `localhost:5432`  |
| `backend` | Django `runserver` (reload)  | `http://localhost:8000` |
| `frontend`| Vite dev server (`npm run dev` in container) | `http://localhost:5173` |

Open the app at **http://localhost:5173**. Set **`VITE_API_BASE=http://localhost:8000`** in `.env` so the browser calls the API on port 8000 when the SPA is not served from the same origin.

First-time backend setup (migrations, superuser) is usually run inside the backend container, for example:

```bash
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py createsuperuser
```

## Production (Docker)

Production uses **`docker-compose.prod.yml`**: Nginx serves the built SPA and proxies `/api/` and `/admin/` to Gunicorn. Only **port 80** is published; the database and Django are not exposed on the host.

Required in **`.env`** at the repository root (or exported in your shell):

- `POSTGRES_PASSWORD`
- `SECRET_KEY`

See **`.env.example`** for the full list. Optional values such as `POSTGRES_DB`, `POSTGRES_USER`, `DEBUG`, `ALLOWED_HOSTS`, `TRUST_PROXY`, and **`VITE_API_BASE`** (passed as a Docker **build arg** for the `web` image when you need an absolute API URL in the built SPA) are documented there.

**Start production stack** (build images, run detached):

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

With inline env (example):

```bash
POSTGRES_PASSWORD=your-secure-password SECRET_KEY=your-django-secret-key docker compose -f docker-compose.prod.yml up -d --build
```

Then open **http://localhost** (or your server’s hostname). Use **`ALLOWED_HOSTS`** (and HTTPS + `TRUST_PROXY` as already set in compose) when deploying under a real domain.

**Stop:**

```bash
docker compose -f docker-compose.prod.yml down
```

## Local frontend without Docker

You can still run Vite on the host:

```bash
cd frontend && npm install && npm run dev
```

Use this if you prefer not to use the `frontend` service from `docker compose up`.

## Project layout

- `.env.example` — template for all services (Django, PostgreSQL, Vite)
- `backend/` — Django project (`setrsoft`), API under `/api/`
- `frontend/` — Vite + React SPA; production image builds static assets and serves them with Nginx
- `docker-compose.yml` — development
- `docker-compose.prod.yml` — production
