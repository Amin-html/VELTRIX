# Используем стабильную версию Python
FROM python:3.13-slim

# Устанавливаем системные зависимости, необходимые для сборки пакетов и работы с PostgreSQL
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Устанавливаем рабочую директорию внутри контейнера
WORKDIR /app

# Запрещаем Python писать файлы .pyc на диск и включаем немедленный вывод логов
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Обновляем pip
RUN pip install --no-cache-dir --upgrade pip

# Копируем файл зависимостей и устанавливаем их
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Копируем весь остальной код бэкенда в контейнер
COPY . /app/

# Открываем порт для Django
EXPOSE 8000
