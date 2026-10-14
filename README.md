# VELTRIX

Платформа для покупки техники, ремонта, запчастей и выкупа устройств (Кыргызстан).
Стек: Next.js + TypeScript + Tailwind, Django + DRF, PostgreSQL, Docker Compose.

## Требования
Docker Desktop (с Compose). Для работы без Docker: Python 3.13, Node.js 20+.

## Первый запуск
```bash
cp .env.example .env
docker compose up --build
```
Сайт: http://localhost:3000 (если порт занят, см. «Типовые ошибки»), API: http://localhost:8000/api/v1/, админка: http://localhost:8000/admin/.

Миграции, создание администратора и демо-данные:
```bash
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py createsuperuser
docker compose exec backend python manage.py seed_demo   # только для разработки (DEBUG=True)
```
Данные PostgreSQL хранятся в томе и сохраняются при обычном перезапуске.

## Роли
Роль пользователя меняется в админке (Users → Role): `customer`, `master`, `admin`.
Мастера назначаются на заявки в админке (Repair requests → Master).
Предложения по выкупу и статусы заказов обрабатываются в админке через действия в списках.

## Тесты и проверки
```bash
docker compose exec backend python manage.py test --noinput
cd frontend && npm run lint && npx tsc --noEmit && npm run build
```
CI (GitHub Actions) запускает то же самое для каждого pull request.

## Разработка
После изменения кода пересоберите образы: `docker compose up -d --build`.
Фронтенд можно запускать вне Docker: `cd frontend && npm install && npm run dev` (бэкенд в Docker должен работать).

## Резервная копия и восстановление базы
(Имя базы и пользователя ниже: `veltrix` и `postgres`; если меняли в `.env`, подставьте свои.)
```bash
docker compose exec -T db pg_dump -U postgres -Fc veltrix -f /tmp/veltrix.dump
docker compose cp db:/tmp/veltrix.dump ./veltrix.dump

docker compose cp ./veltrix.dump db:/tmp/veltrix.dump
docker compose exec db pg_restore -U postgres -d veltrix --clean --if-exists /tmp/veltrix.dump
```

## Сброс локальной базы (удаляет все данные)
```bash
docker compose down -v
docker compose up -d --build
docker compose exec backend python manage.py migrate
```

## Статус внешних сервисов
| Возможность | Статус |
|---|---|
| Email-подтверждение | Работает; в разработке письма выводятся в консоль бэкенда (`docker compose logs backend`), SMTP не подключён |
| Телефонный OTP, вход по коду | Не реализовано |
| Google OAuth | Не реализовано |
| Онлайн-оплата | Не реализовано; доступна только оплата при получении |
| Хранилище фото | Локальная папка `backend/media/`; для production нужно внешнее (S3-совместимое) |
| Демо-фото товаров | Заглушки; заменить на собственные до релиза |

## Типовые ошибки
- **`failed to resolve host 'db'`** при запуске команд Django в Windows: команды нужно выполнять внутри контейнера (`docker compose exec backend ...`), имя `db` существует только в сети Docker.
- **Порт 3000 занят**: Next.js при локальном запуске выберет следующий порт (3001); для API это не меняет ничего, но добавьте его в `CSRF_TRUSTED_ORIGINS`.
- **`Cannot use ImageField because Pillow is not installed`**: пересоберите образ бэкенда (`docker compose up -d --build backend`).
- **База test_veltrix уже существует** при тестах: запускайте с флагом `--noinput`.
- **Изменения не видны в контейнере**: код копируется при сборке, добавьте `--build`.

## Юридическое
Политику конфиденциальности, условия использования и правила продажи б/у техники нужно проверить с местным юристом до публичного запуска. Название VELTRIX предварительное: проверьте товарные знаки и домены.