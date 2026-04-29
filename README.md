# Playto Payout Engine

A robust, ledger-backed payout engine built with Django, DRF, Celery, and PostgreSQL. It enforces idempotency, prevents balance overdrafts via row-level locks, and maintains an append-only ledger.

## Deliverables Checklist

- [x] GitHub repository with clean commit history.
- [x] README.md with setup instructions (this file).
- [x] Seed script to populate merchants (`backend/merchants/management/commands/seed_data.py`).
- [x] Concurrency and idempotency tests (`backend/payouts/tests.py`).
- [x] EXPLAINER.md
- [x] bonus: docker-compose.yml

## Setup Instructions


### Running Without Docker (Local Setup)

If you prefer to run the services directly on your host machine without Docker:

1. **Clone the repository** and navigate to the root directory.
2. **Setup Database and Redis**: Neon PostgreSQL – Create a free database on Neon and update .env (backend) and a Redis server running on `localhost:6379`.
3. **Setup the Backend**:

   ```bash
   cd backend
   python -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt

   # Apply migrations and seed the database
   python manage.py migrate
   python manage.py seed_data

   # Start the Django development server
   python manage.py runserver
   ```

4. **Start the Celery Workers** (in separate terminal tabs, from the `backend` directory with the virtualenv activated):

   ```bash
   # Terminal 2 - Start the worker
   celery -A backend worker -l INFO

   # Terminal 3 - Start the beat scheduler
   celery -A backend beat -l INFO
   ```

5. **Setup the Frontend** (in a new terminal tab):
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   The backend API will be available at `http://localhost:8000` and the frontend application at `http://localhost:5173`.


### Prerequisites

- Docker & Docker Compose
- (Optional) Python 3.10+, Virtualenv to run locally outside Docker

### Running the Project

1. Clone the repository and navigate to the root directory.
2. Run the application stack:

   ```bash
   docker-compose up --build
   ```

   This will spin up the database, Redis (for Celery), the backend API server, the Celery worker, and the Celery beat scheduler. The frontend container will also start.

3. Apply migrations and seed the database:

   ```bash
   docker-compose exec backend python manage.py migrate
   docker-compose exec backend python manage.py seed_data
   ```

4. Create a superuser (optional, for admin access):
   ```bash
   docker-compose exec backend python manage.py createsuperuser
   ```

The backend is now running at `http://localhost:8000/`.
The frontend is now running at `http://localhost:5173/`.

### Running Tests

To execute the test suite (which includes concurrency and idempotency tests):

```bash
docker-compose exec backend pytest
```
