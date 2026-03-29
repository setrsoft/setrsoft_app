# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SetRsoft is a climbing route setting tool. It has a React/TypeScript SPA frontend and a Django REST API backend, containerized with Docker Compose.

## Development Commands

### Docker (recommended — runs everything)
```bash
cp .env.example .env
docker compose up
# Frontend: http://localhost:5173 | Backend: http://localhost:8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev       # Vite dev server on :5173
npm run build     # tsc + vite build
npm run lint      # ESLint
npm run preview   # preview prod build
```

### Backend
```bash
cd backend
source .venv/bin/activate
python manage.py runserver         # dev server on :8000
python manage.py migrate
python manage.py makemigrations
python manage.py test              # all tests
python manage.py test api.tests.HealthCheckTest.test_health_endpoint  # single test
```

## Architecture

### Frontend (`frontend/src/`)
Feature-based structure:
- `app/` — router, root layout, app bootstrap
- `features/` — self-contained feature modules (`showcase/`, `gym/`, `editor/`)
- `shared/` — cross-feature utilities: `api/client.ts` (fetch wrapper), `auth/` (context + hooks), `components/`
- `core/` — app-wide constants, env vars, UI primitives
- `locales/` — i18n JSON files (en, fr, de, ru, cn)

Entry point: `main.tsx` → `QueryClientProvider` + `AuthProvider` + `App` (router) → `Root` (layout with nav/footer) → route pages.

### Backend (`backend/`)
- `setrsoft/` — Django project config (`settings.py`, `urls.py`, `wsgi.py`)
- `api/` — REST endpoints (`views.py`, `urls.py`, `tests.py`)
- API routes mounted under `/api/`; currently only `GET /api/health/`

### Frontend ↔ Backend
- `VITE_API_BASE` env var sets the API origin
- `shared/api/client.ts` wraps `fetch` with typed `get<T>()` / `post<T>()` methods
- TanStack React Query v5 used for server-state caching

### Production
`docker-compose.prod.yml`: Nginx serves the Vite build and reverse-proxies `/api/`, `/admin/`, `/static/` to Gunicorn. Only port 80 is exposed.

## Key Conventions (from AGENTS.md)

### Styling
- **Tailwind v4**: theme tokens are defined via `@theme` directive in `src/index.css`, not `tailwind.config.js`.
- Use named design tokens (`surface-low`, `surface-high`, `mint`, `on-surface-variant`, etc.).
- No 1px borders — use background color shifts to separate surfaces instead.

### i18n
- All user-facing strings must use the `useTranslation()` hook. Never hardcode display text.

### Backend
- Follow standard Django conventions.
- Always generate and commit migrations when changing models.

## Environment Variables

Copy `.env.example` to `.env`. Key variables:
```
POSTGRES_DB / POSTGRES_USER / POSTGRES_PASSWORD / POSTGRES_HOST / POSTGRES_PORT
VITE_API_BASE=http://localhost:8000   # for frontend → backend calls outside Docker
SECRET_KEY                             # required in production
```
