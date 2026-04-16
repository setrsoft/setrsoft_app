<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://github.com/user-attachments/assets/47a5b20d-584a-47e3-af36-522815f22dc0">
    <source media="(prefers-color-scheme: light)" srcset="https://github.com/user-attachments/assets/47a5b20d-584a-47e3-af36-522815f22dc0">
    <img alt="setrsoft logo" src="https://github.com/user-attachments/assets/47a5b20d-584a-47e3-af36-522815f22dc0" width="300" height="100" style="max-width: 100%">
  </picture>
  <br/>
  <br/>
  <a href="https://github.com/setrsoft/setrsoft_app/actions/workflows/ci.yml"><img alt="CI Status" src="https://github.com/setrsoft/setrsoft_app/actions/workflows/ci.yml/badge.svg?branch=main"></a>
  <a href="https://discord.gg/BdyfNU9TpR"><img alt="Discord" src="https://img.shields.io/badge/Discord-Join-7289da?logo=discord&logoColor=white"></a>
  <a href="https://github.com/setrsoft/setrsoft_app/releases"><img alt="GitHub release" src="https://img.shields.io/github/release/setrsoft/setrsoft_app"></a>
</p>



## Welcome

SetRsoft is an open source community driven software. Test it live on the website http://www.setrsoft.com/ 

For better understanding the purpose of this project you can have a look at [one of those videos](https://www.youtube.com/results?search_query=routesetting+in+climbing+gym).

Feel free to create new Github Issues for new features or signal bugs. 


## Installation instructions

Clone the repo and run
```bash
# The first run can take some time
cp .env.example .env
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
