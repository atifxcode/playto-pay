# Playto Payout Engine

A robust, ledger-backed payout engine built with Django, DRF, Celery, React, and PostgreSQL. It enforces idempotency, prevents balance overdrafts via row-level locks, and maintains an append-only ledger.

## 🚀 Live Links

| Resource | Link |
|----------|------|
| **Frontend Application** | https://playto-pay-six.vercel.app/dashboard |
| **Backend API** | https://playto-pay-w0s5.onrender.com |
| **Demo Video** | https://www.youtube.com/watch?v=Mxr2OHrpBb4&t=167s |

## Deliverables Checklist

- [x] GitHub repository with clean commit history.
- [x] README.md with setup instructions (this file).
- [x] Seed script to populate merchants (`backend/merchants/management/commands/seed_data.py`).
- [x] Concurrency and idempotency tests (`backend/payouts/tests.py`).
- [x] EXPLAINER.md
- [x] bonus: docker-compose.yml

## Setup Instructions


### Prerequisites

- Python 3.10+
- PostgreSQL database (Neon recommended)
- Redis server (`localhost:6379`)
- Node.js 18+ for frontend

### Running Without Docker (Local Setup)

1. **Clone the repository** and navigate to the root directory.

2. **Setup Database and Redis**:
   - Create a free PostgreSQL database on [Neon](https://neon.tech)
   - Update `backend/.env` with your database credentials
   - Ensure Redis is running on `localhost:6379`

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

### Running Tests

To execute the test suite (which includes concurrency and idempotency tests):

```bash
cd backend
pytest payouts/tests.py -v
```

---

## 📝 Deployment Notes

**Celery Worker Not Deployed on Production**

The deployed backend on Render does not include a Celery worker. Here's why:

- **Cost**: Celery worker services on Render require paid plans ($7+/month minimum) to run continuously
- **Current Setup**: 
  - ✅ Backend API deployed on Render (free tier with limited resources)
  - ✅ Redis cache deployed on Render (paid, ~$5/month)
  - ❌ Celery Worker **not deployed** (would require additional paid service)

**Implications**:
- Synchronous payout requests work fine ✅
- Asynchronous task processing (e.g., `process_payout`) is queued but **not processed** in production
- For local development and testing, run Celery workers locally (see step 4 in Setup Instructions)
