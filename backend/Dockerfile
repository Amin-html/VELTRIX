# Используем стабильную версию Python
FROM python:3.13-slim

# Устанавливаем системные зависимости
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

RUN pip install --no-cache-dir --upgrade pip

COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

COPY . /app/

EXPOSE 8000

# === ДОБАВЬТЕ ЭТУ СТРОКУ СЮДА ===
CMD python manage.py migrate && gunicorn config.wsgi:application --bind 0.0.0.0:8000
