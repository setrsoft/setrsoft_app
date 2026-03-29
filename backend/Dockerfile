# setrsoft backend API (Django + Gunicorn)
FROM python:3.12-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Collect admin and app static files for WhiteNoise (no DB connection required).
ENV SECRET_KEY=collectstatic-build-placeholder
RUN python manage.py collectstatic --noinput

EXPOSE 8000

CMD ["gunicorn", "setrsoft.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "2"]
