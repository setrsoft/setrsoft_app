<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://github.com/user-attachments/assets/47a5b20d-584a-47e3-af36-522815f22dc0">
    <source media="(prefers-color-scheme: light)" srcset="https://github.com/user-attachments/assets/47a5b20d-584a-47e3-af36-522815f22dc0">
    <img alt="setrsoft logo" src="https://github.com/user-attachments/assets/47a5b20d-584a-47e3-af36-522815f22dc0" width="300" height="100" style="max-width: 100%">
  </picture>
  <br/>
  <br/>
</p>

[![CI Status](https://github.com/setrsoft/setrsoft_app/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/setrsoft/setrsoft_app/actions/workflows/ci.yml)
[![Discord](https://img.shields.io/badge/Discord-Join-7289da?logo=discord&logoColor=white)](https://discord.gg/BdyfNU9TpR)
<a href="https://github.com/huggingface/huggingface_hub/releases"><img alt="GitHub release" src="https://img.shields.io/github/release/setrsoft/"></a>

## Welcome to the SetRsoft project

All the project is OpenSource, test it live on the website http://www.setrsoft.com/ 
This project is comunity driven, please feel free to create new Github Issues for new features or signal bugs. 


## Installation instructions

Clone the repo and run
```bash
// The first run can take some time
docker compose up
```

This starts:

| Service   | Role                         | URL / port        |
| --------- | ---------------------------- | ----------------- |
| `db`      | PostgreSQL                   | `localhost:5432`  |
| `backend` | Django `runserver` (reload)  | `http://localhost:8000` |
| `frontend`| Vite dev server (`npm run dev` in container) | `http://localhost:5173` |

Open the app at **http://localhost:5173**

## Project layout

- `backend/` — Django project (`setrsoft`), API under `/api/`
- `frontend/` — Vite + React SPA; production image builds static assets and serves them with Nginx

- `docker-compose.yml` — development
- `docker-compose.prod.yml` — production
